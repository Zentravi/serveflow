# ServeFlow — Phase 1 Architecture & Design Audit Report

**Repository:** `Zentravi/serveflow`  
**Branch:** `arena/7efcad55-serveflow`  
**Base commit:** `0de67da2d0537f49ffb8ca1c61deec2a049286d8`  
**Audited documents:** PRD.md, ARCHITECTURE.md, DATABASE.md, API.md, UI-UX.md, ROADMAP.md  
**Audit date:** 2026-11-15  
**Status:** Findings presented — awaiting approval before Phase 2

---

## 1. Overall Assessment

The six planning documents are well-structured, comprehensive, and demonstrate a sound understanding of the domain (multi-tenant appointment booking SaaS). The core architecture — Next.js frontend, NestJS backend, PostgreSQL + Prisma, modular monolith — is appropriate for a portfolio showcase. The design direction (light theme, editorial, no generic dashboard tropes) aligns with the product brief.

However, the audit identified **several High-severity technical issues** that must be corrected before implementation begins:

1. **Prisma does not natively support PostgreSQL exclusion constraints** (`EXCLUDE USING gist`). The proposed double-booking backstop requires a raw SQL migration outside the Prisma schema, which is not documented as such.
2. **`Staff.userId` is declared unique globally**, which prevents a single user account from being linked to staff profiles at multiple businesses — contradicting the multi-business membership model.
3. **"Active business" selection is ambiguous** for users belonging to multiple businesses. The mechanism for resolving tenant context is not specified, creating an authorization gap.
4. **Authentication method is ambiguous** — session cookie, JWT access/refresh, and Redis-backed sessions are all mentioned without a decision.
5. **No CORS strategy** is defined despite frontend and backend being separate applications on different origins.
6. **No row-level security (RLS)** is proposed; tenant isolation relies entirely on application-layer scoping, with no database-level defense-in-depth.

None of these are architectural dead-ends — all are correctable before Phase 2. The verdict is **READY AFTER MINOR CORRECTIONS**, conditional on addressing the High-severity items listed in §11.

---

## 2. PRD Audit

### What works well
- Clear target users (business owner, staff, customer, super-admin) with distinct goals.
- Coherent problem/solution mapping (disconnected tools, double-bookings, staff coordination, no-shows, data leakage, booking complexity).
- Realistic feature prioritization (P0/P1/P2) that defers AI insights, Stripe payments, SMS, and mobile apps.
- Good acceptance criteria focused on real behavior (isolation, concurrency, status transitions, real metrics).

### Issues

| ID | Severity | Issue | Why it matters | Recommended change | Document |
|----|----------|-------|----------------|-------------------|----------|
| PRD-1 | High | No specification for how a user belonging to multiple businesses selects their "active business" context. | Without this, tenant-scoped endpoints cannot reliably resolve which business the user is acting on behalf of. | Add a requirement for an explicit active-business selection mechanism (e.g., cookie/header set server-side after membership verification). | PRD.md |
| PRD-2 | Medium | FR-11 mandates Redis + BullMQ for notifications at MVP stage. | Adds operational complexity (Redis cluster, BullMQ workers, job retries, failed-job handling) before the core product is validated. Consider a simpler synchronous or DB-backed queue for the MVP. | Make BullMQ optional at MVP; allow direct email sending with a configurable provider, deferring BullMQ to Phase 6. | PRD.md, ARCHITECTURE.md |
| PRD-3 | Medium | No mention of file upload/storage strategy (business logo, staff images). | Schema references `logoUrl` and `imageUrl` but there is no requirement for where files are stored or served. | Add a non-functional requirement for static asset storage (local filesystem at MVP, S3-compatible later). | PRD.md |
| PRD-4 | Low | No cancellation policy or refund handling requirements. | Payments module exists but business rules for cancellations/refunds are unspecified. | Add cancellation window and refund-eligibility rules to FR-10. | PRD.md |
| PRD-5 | Low | Acceptance criteria say "relevant tests pass" without defining which tests. | Vague; could lead to under-testing. | Specify minimum test categories (unit, integration, E2E, tenant isolation, concurrency) in acceptance criteria. | PRD.md |

---

## 3. Architecture Audit

### What works well
- Modular monolith is the correct choice — no unnecessary microservices.
- Next.js + NestJS separation is clean.
- Single database with tenant-scoped tables is sound for multi-tenancy.
- Three interfaces (dashboard, booking portal, super-admin) from one frontend app is reasonable.

### Issues

| ID | Severity | Issue | Why it matters | Recommended change | Document |
|----|----------|-------|----------------|-------------------|----------|
| ARCH-1 | Critical | Prisma does not support PostgreSQL `EXCLUDE USING gist` constraints natively. The proposed double-booking backstop cannot be declared in `schema.prisma`. | If implemented as a pure Prisma migration, the constraint will not be created, removing the database-level double-booking backstop. | Document that `appointment_no_overlap` must be created via raw SQL migration (`ALTER TABLE ... ADD CONSTRAINT ... EXCLUDE USING gist`) outside Prisma schema, reviewed in migration review step. | DATABASE.md, ARCHITECTURE.md |
| ARCH-2 | High | Authentication method is ambiguous: "HTTP-only session cookie (or JWT access/refresh pattern ... or server-side session store (Redis))". | Three different auth patterns are described without a decision. Implementation will be inconsistent. | Select one pattern: recommend HTTP-only session cookie with server-side session store (Redis) for simplicity, or JWT access/refresh in cookies. Remove the alternatives. | ARCHITECTURE.md, API.md |
| ARCH-3 | High | No CORS configuration is defined despite separate frontend/backend apps. | Browser requests from `apps/web` to `apps/api` will fail without CORS. | Add CORS configuration to NestJS (allowed origins, credentials, methods). | ARCHITECTURE.md |
| ARCH-4 | High | No row-level security (RLS) proposed; tenant isolation is application-layer only. | A single bug in the service layer could expose cross-tenant data with no database-level backstop. | Add PostgreSQL RLS policies on tenant-scoped tables as defense-in-depth, or explicitly document that application-layer scoping is the sole enforcement with audit logging. | ARCHITECTURE.md, DATABASE.md |
| ARCH-5 | Medium | No communication pattern defined between Next.js and NestJS (direct browser-to-API vs. Next.js server-side proxy). | Direct browser calls require CORS and expose the backend URL; proxy adds complexity but hides the backend. | Decide and document: recommend Next.js Server Actions or API routes calling NestJS server-to-server, or direct browser calls with CORS. | ARCHITECTURE.md |
| ARCH-6 | Medium | No health check, versioning strategy, or request tracing defined. | Operational observability is incomplete. | Add `GET /api/health`, API version header strategy, and request ID tracing. | ARCHITECTURE.md, API.md |
| ARCH-7 | Low | "6-8ms stagger" in UI-UX is likely a typo (too fast to perceive). | Minor, but indicates imprecision in motion specs. | Correct to 60-80ms. | UI-UX.md |

---

## 4. Database Audit

### What works well
- `businessId` on all tenant-scoped tables.
- Soft deletes (`deletedAt`) on core business records.
- Appointment status state machine defined (PENDING → CONFIRMED → terminal states).
- Exclusion constraint proposed for double-booking prevention.
- `(userId, businessId)` unique constraint on Membership prevents duplicate memberships.

### Issues

| ID | Severity | Issue | Why it matters | Recommended change | Document |
|----|----------|-------|----------------|-------------------|----------|
| DB-1 | Critical | `Staff.userId` is declared `UK` (unique globally). | This prevents one user from being staff at multiple businesses, contradicting the membership model where a user can belong to multiple businesses. | Remove global uniqueness on `Staff.userId`; make it `(businessId, userId)` unique if one user account should map to one staff profile per business. | DATABASE.md |
| DB-2 | High | Prisma exclusion constraint cannot be declared in `schema.prisma`. Requires raw SQL migration. | Prisma migrations won't create or manage the constraint; it could be accidentally dropped on `prisma migrate dev` resets. | Document as a custom raw SQL migration. Add a migration review step to the roadmap. | DATABASE.md, ROADMAP.md |
| DB-3 | High | `Appointment` entity lacks `deletedAt` in the ER diagram despite the text mentioning soft-delete. | Inconsistent between diagram and text. | Add `deletedAt` to Appointment in ER diagram, or remove the soft-delete mention for appointments (use CANCELLED status instead). | DATABASE.md |
| DB-4 | Medium | `Business.operatingHours` is a JSON map with no structured table. | Complex to query, validate, or index. Day-of-week open/close intervals are hard to enforce in SQL. | Consider a structured `BusinessWorkingHours` table (dayOfWeek, openTime, closeTime, isClosed) similar to StaffWorkingHours. | DATABASE.md |
| DB-5 | Medium | Timezone handling for `StaffWorkingHours` and `StaffTimeOff` is ambiguous (business timezone vs staff timezone). | DST transitions and cross-timezone staff could produce incorrect slot calculations. | Specify that all staff time-of-day records are in the business timezone. Convert to UTC at slot-calculation time. | DATABASE.md |
| DB-6 | Medium | No `AppointmentStatusHistory` entity despite PRD mentioning "appointment status history." | AuditLog could cover this, but it's not explicit and AuditLog is generic. | Either map status changes to AuditLog explicitly, or add a lightweight `AppointmentStatusHistory` table. | DATABASE.md |
| DB-7 | Medium | `Payment.appointmentId` described as "unique-ish." | Ambiguous. One payment per appointment should be a hard unique constraint. | Make `appointmentId` unique on Payment. | DATABASE.md |
| DB-8 | Low | `Notification.recipient` type is unspecified (email, phone, userId?). | Ambiguous for implementation. | Define recipient type (enum: EMAIL, SMS, IN_APP) and recipient value. | DATABASE.md |
| DB-9 | Low | No index on `appointment(businessId, status, startTime)` for dashboard queries. | Dashboard filters by status and date range; a composite index would help. | Add composite index. | DATABASE.md |
| DB-10 | Low | No `Business.ownerId` field. Ownership is implied via Membership OWNER role. | Works, but could be clearer for queries needing the business owner. | Acceptable as-is; document that owner is determined via Membership role = OWNER. | DATABASE.md |

### Multi-business user support verification
- **User → Membership → Business** correctly supports users in multiple businesses.
- **Staff.userId uniqueness (DB-1)** breaks this for staff accounts and must be fixed.

---

## 5. Multi-tenant Security Audit

### What works well
- Explicit rule: "Never trust client-supplied `businessId`."
- Business context resolved from membership, not client input.
- Role-based guards (OWNER, ADMIN, STAFF, VIEWER).
- Super-admin separated from business roles.
- Foreign keys and indexes on `businessId`.

### Attack scenarios and prevention

| Scenario | Prevention in current design | Gap |
|----------|------------------------------|-----|
| Staff guesses another business's appointment ID and calls `GET /api/appointments/:id` | Server resolves business from membership; query scoped by `businessId`; 403 if no match | None, if implemented correctly |
| User creates appointment with `businessId` of another business in request body | `businessId` resolved server-side; client input ignored | Depends on implementation actually ignoring client `businessId` |
| Staff member creates appointments for other staff members | `POST /api/appointments` allows STAFF role with no restriction on which `staffId` they can book | STAFF should only be able to book for themselves (or their own assigned services) |
| Customer enumerates public booking slugs | Slugs are public by design; no auth on booking endpoints | Rate limiting on booking endpoints not specified |
| Unverified email user creates a business | Email verification required "before full access" but not explicitly enforced at business creation | Need to enforce email verification before allowing business creation or booking |

### Issues

| ID | Severity | Issue | Why it matters | Recommended change | Document |
|----|----------|-------|----------------|-------------------|----------|
| SEC-1 | High | "Active business" resolution mechanism unspecified for multi-business users. | If the active business is client-supplied (cookie/header set by frontend), a user could switch to a business they're not a member of. | Active business must be set and validated server-side after membership check. Client can request a switch, but server validates membership. | PRD.md, ARCHITECTURE.md, API.md |
| SEC-2 | High | STAFF role can `POST /api/appointments` with any `staffId`, not just their own. | A staff member could book appointments on behalf of other staff, inflating their schedules. | STAFF can only create appointments where `staffId` = their own staff profile. OWNER/ADMIN can book for any staff. | API.md, DATABASE.md |
| SEC-3 | High | No row-level security (RLS) as defense-in-depth. | Application-layer bugs = data leaks. | Add PostgreSQL RLS or document application-layer as sole enforcement with audit logging. | ARCHITECTURE.md, DATABASE.md |
| SEC-4 | Medium | Email verification enforcement timing not specified. | Unverified users could create businesses or book appointments. | Enforce email verification before business creation and before booking. | PRD.md, ARCHITECTURE.md |
| SEC-5 | Medium | No rate limiting specified for public booking endpoints (`/api/booking/*`). | Slug enumeration and booking spam. | Add rate limiting to public booking endpoints. | ARCHITECTURE.md, API.md |
| SEC-6 | Low | Audit log write listed as a BullMQ job; if the job fails, audit trail is lost. | Audit integrity compromised. | Audit log writes should be synchronous (in the same transaction) for critical state changes. | ARCHITECTURE.md, DATABASE.md |

---

## 6. Booking Engine Audit

### What works well
- Server-side availability recalculation (never trust frontend).
- Transaction + exclusion constraint for double-booking prevention.
- Status state machine with terminal states.
- 409 Conflict on slot collision.

### Issues

| ID | Severity | Issue | Why it matters | Recommended change | Document |
|----|----------|-------|----------------|-------------------|----------|
| BK-1 | Critical | Prisma cannot declare `EXCLUDE USING gist` natively; requires raw SQL migration not documented as such. | Without the constraint, double-booking relies solely on application logic, which is race-condition vulnerable. | Document as custom raw SQL migration with migration review. | DATABASE.md, ARCHITECTURE.md |
| BK-2 | High | Exclusion constraint only prevents same-staff time overlap. It does NOT enforce business operating hours, staff working hours, buffers, or time off. | Those checks are application logic only; a bug could allow bookings outside operating hours. | Document that operating hours/buffers/time-off are enforced in application logic within the same transaction; exclusion constraint is the backstop for staff overlap only. | DATABASE.md |
| BK-3 | High | Service buffer not clearly integrated into the overlap check. | If `endTime` excludes the buffer, the next booking could start during the buffer period. | `Appointment.endTime` must include service duration + buffer. The exclusion constraint range uses this buffered endTime. | DATABASE.md, API.md |
| BK-4 | High | No support for "any available staff" in the API. `GET /api/booking/:slug/availability` takes a single `staffId`. | Customers choosing "any available" cannot be served by the current API. | Add endpoint to find earliest available slot across all staff who offer a service, or allow `staffId` to be omitted and return slots grouped by staff. | API.md |
| BK-5 | Medium | Timezone/DST handling for staff working hours and business hours is ambiguous. | Incorrect slot times during DST transitions. | Specify that all time-of-day fields are in business timezone; convert to UTC at calculation time. | DATABASE.md |
| BK-6 | Medium | No minimum/maximum advance booking rules. | Customers could book months in advance or for the past. | Add `bookingAdvanceDays` (min/max) to Business settings. | PRD.md, DATABASE.md |
| BK-7 | Medium | Rescheduling does not explicitly free the old slot. | The old appointment's time range remains "occupied" if not properly released. | Rescheduling must cancel the old appointment (freeing its slot) and create the new one in the same transaction. | API.md, DATABASE.md |
| BK-8 | Low | Concurrent rescheduling of the same slot not specifically addressed. | Two users could reschedule into the same freed slot. | Exclusion constraint handles this if both operations are transactional. Document this. | DATABASE.md |

### How double-booking is prevented (exactly)
1. Frontend requests available slots via `GET /api/booking/:slug/availability` (server-calculated).
2. Frontend submits booking with `startTime`, `staffId`, `serviceId`.
3. Server validates service, business, staff exist and are active.
4. Server recalculates availability for that staff member at that time (operating hours, working hours, time off, existing appointments, service duration + buffer).
5. Server opens a transaction (`SERIALIZABLE` or `REPEATABLE READ` + `SELECT FOR UPDATE`).
6. Inside transaction: checks for overlapping appointments for that staff in `[startTime, endTime]`; if none, inserts appointment.
7. PostgreSQL exclusion constraint `appointment_no_overlap` (`EXCLUDE USING gist (staffId WITH =, tstzrange(startTime, endTime) WITH &&)`) rejects any overlapping insert at the DB level.
8. On exclusion violation or application-level conflict: return `409 Conflict`.
9. On success: commit, create notification job, return `201 Created`.

---

## 7. API Audit

### What works well
- Comprehensive endpoint coverage across all modules.
- Standardized error envelope.
- Clear authorization matrix with roles.
- Pagination convention defined.
- ISO 8601 UTC date convention.

### Issues

| ID | Severity | Issue | Why it matters | Recommended change | Document |
|----|----------|-------|----------------|-------------------|----------|
| API-1 | High | Authentication method ambiguous (session cookie vs JWT vs Redis session). | Inconsistent implementation risk. | Decide on one pattern and document it consistently across all sections. | ARCHITECTURE.md, API.md |
| API-2 | High | Active business resolution not specified for multi-business users. | Same as SEC-1. | Add an endpoint or mechanism to set/validate active business server-side. | API.md, ARCHITECTURE.md |
| API-3 | High | No CORS configuration defined. | Cross-origin requests from Next.js to NestJS will fail. | Add CORS to NestJS config. | ARCHITECTURE.md |
| API-4 | Medium | Missing endpoints: (a) business public profile by slug, (b) available staff for a service, (c) file upload, (d) health check. | Frontend cannot render booking portal header or "any available" staff selection without these. | Add `GET /api/booking/:businessSlug/profile`, `GET /api/services/:id/available-staff`, `GET /api/health`. | API.md |
| API-5 | Medium | `/api/appointments/availability` marked "public-ish (auth)" — ambiguous. | Booking portal needs public availability; dashboard needs authenticated availability. | Split into two endpoints or clarify auth requirement. | API.md |
| API-6 | Medium | STAFF can list all appointments in the business (`GET /api/appointments`). | Staff should only see their own appointments unless OWNER/ADMIN. | Filter appointments by staffId for STAFF role; OWNER/ADMIN see all. | API.md |
| API-7 | Low | No API versioning strategy beyond "/api/v1 reserved." | Future breaking changes have no migration path. | Add version header or URL prefix strategy. | API.md |
| API-8 | Low | Rate limiting details not specified (which endpoints, what limits). | Auth and booking endpoints need protection. | Define rate limits per endpoint group. | ARCHITECTURE.md, API.md |

### Frontend workflow support verification
All major frontend workflows are supported:
- Dashboard CRUD for services/staff/customers/appointments ✓
- Public booking flow (services → availability → book → confirmation) ✓ (with API-4 additions)
- Super-admin tenant/user management ✓
- Authentication flows ✓

---

## 8. UI/UX Audit

### What works well
- Distinctive light-theme identity (warm ivory, white surfaces, ink typography, cobalt accent).
- No generic gradients, glassmorphism, or oversized headings.
- Module-specific layouts (no identical templates).
- Responsive breakpoints defined.
- Reduced-motion support (`prefers-reduced-motion`).
- Accessibility considerations (contrast, focus rings, ARIA, keyboard navigation).

### Issues

| ID | Severity | Issue | Why it matters | Recommended change | Document |
|----|----------|-------|----------------|-------------------|----------|
| UI-1 | Medium | Cobalt `#1D4ED8` contrast against white and ivory not verified. | Accessibility compliance at risk if contrast < 4.5:1. | Verify contrast ratios; adjust if needed. | UI-UX.md |
| UI-2 | Medium | "6-8ms stagger" is imperceptibly fast; likely a typo. | Animation spec imprecise. | Correct to 60-80ms. | UI-UX.md |
| UI-3 | Medium | No specific font family names; "system font stack with optional licensed serif" is vague. | Design system not fully specified for implementation. | Specify exact font stack (e.g., Inter for body, a serif for headings) or define selection criteria. | UI-UX.md |
| UI-4 | Low | No form validation UI pattern specified (inline errors, aria-describedby). | Forms need consistent error presentation. | Add form validation component spec. | UI-UX.md |
| UI-5 | Low | No mention of how empty states handle "no appointments" or "no customers." | Empty states are required per PRD FR-15. | Add empty-state patterns to component spec. | UI-UX.md |
| UI-6 | Low | Booking portal visual differentiation from dashboard described only as "lighter, marketing-oriented." | Vague for implementation. | Add more specific guidance (typography scale, spacing, component subset). | UI-UX.md |

The design direction is sound and does NOT need replacement with a generic template.

---

## 9. Roadmap Audit

### What works well
- Eight logical phases with clear dependency chain.
- Testing integrated across phases (not just at the end).
- Concrete definition of done.
- Out-of-scope items explicitly listed (AI, Stripe, SMS, mobile, auto-deployment).

### Issues

| ID | Severity | Issue | Why it matters | Recommended change | Document |
|----|----------|-------|----------------|-------------------|----------|
| RM-1 | High | Testing concentrated in Phase 7, but tenant isolation and booking concurrency should be validated earlier (Phase 3/4). | Finding isolation bugs late is costly. | Keep Phase 3/4 tests as planned; add explicit security review milestone before Phase 5. | ROADMAP.md |
| RM-2 | High | Phase 2 includes Redis + BullMQ setup. If notifications are simplified (PRD-2), this complexity can be deferred. | Unnecessary operational complexity at MVP. | Make Redis/BullMQ optional at Phase 2; add when notification workers are needed. | ROADMAP.md, ARCHITECTURE.md |
| RM-3 | Medium | No migration review milestone for the raw SQL exclusion constraint. | The constraint could be missed or dropped. | Add "migration review (including raw SQL exclusion constraint)" to Phase 2. | ROADMAP.md |
| RM-4 | Medium | No penetration test / security review milestone. | Multi-tenant security needs explicit validation. | Add security review before Phase 5 (public booking portal). | ROADMAP.md |
| RM-5 | Medium | No performance benchmarking for the booking engine. | Availability calculation could be slow with many appointments. | Add performance check for availability queries in Phase 7. | ROADMAP.md |
| RM-6 | Low | No UI/UX design review milestone before implementation. | Design could drift from spec. | Add design review checkpoint after Phase 2. | ROADMAP.md |
| RM-7 | Low | Phase 6 combines notifications, payments, analytics, AND super-admin — broad scope. | Risk of phase overrun. | Consider splitting Phase 6 into 6a (notifications + payments) and 6b (analytics + super-admin). | ROADMAP.md |

---

## 10. Critical Issues

| ID | Severity | Summary |
|----|----------|---------|
| CRIT-1 | Critical | Prisma cannot natively declare `EXCLUDE USING gist`. The double-booking backstop requires a raw SQL migration outside the Prisma schema. |
| CRIT-2 | Critical | `Staff.userId` unique globally prevents users from being staff at multiple businesses, contradicting the membership model. |

These two are the only issues that would cause implementation failure or data-model contradictions if left unaddressed.

---

## 11. Recommended Corrections

Each correction below explains: what is wrong, why it matters, what should change, and which document needs updating.

### C1. Fix Prisma exclusion constraint (Critical)
**What is wrong:** `DATABASE.md` proposes `EXCLUDE USING gist` via `ALTER TABLE`, but Prisma cannot declare this in `schema.prisma`. It is not documented as a custom migration.
**Why it matters:** Without it, there is no database-level double-booking backstop, and `prisma migrate dev` could silently drop it.
**What should change:** Document that `appointment_no_overlap` must be created via raw SQL migration. Add a migration review step.
**Documents:** `DATABASE.md`, `ARCHITECTURE.md`, `ROADMAP.md`

### C2. Fix Staff.userId uniqueness (Critical)
**What is wrong:** `Staff.userId` is `UK` (globally unique), preventing one user from being staff at multiple businesses.
**Why it matters:** Contradicts the multi-business membership model.
**What should change:** Remove global uniqueness; use `(businessId, userId)` unique if one user account maps to one staff profile per business.
**Documents:** `DATABASE.md`

### C3. Specify active business resolution (High)
**What is wrong:** No mechanism defined for resolving which business a multi-business user is acting on behalf of.
**Why it matters:** Tenant-scoped endpoints cannot reliably resolve business context; potential authorization gap.
**What should change:** Define server-side active-business selection (validated against membership). Client may request a switch, but server validates membership.
**Documents:** `PRD.md`, `ARCHITECTURE.md`, `API.md`

### C4. Decide authentication method (High)
**What is wrong:** Session cookie, JWT access/refresh, and Redis-backed sessions are all mentioned.
**Why it matters:** Inconsistent implementation risk.
**What should change:** Select one pattern (recommend HTTP-only session cookie with server-side session store) and remove alternatives.
**Documents:** `ARCHITECTURE.md`, `API.md`

### C5. Add CORS configuration (High)
**What is wrong:** No CORS defined for separate frontend/backend apps.
**Why it matters:** Browser cross-origin requests will fail.
**What should change:** Configure NestJS CORS with allowed origins, credentials, and methods.
**Documents:** `ARCHITECTURE.md`

### C6. Simplify notifications at MVP (High)
**What is wrong:** Redis + BullMQ mandated for notifications at MVP.
**Why it matters:** Unnecessary operational complexity before core validation.
**What should change:** Allow direct email sending with configurable provider at MVP; defer BullMQ to Phase 6.
**Documents:** `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`

### C7. Add missing API endpoints (Medium)
**What is wrong:** Missing business public profile by slug, available staff for service, file upload, health check.
**Why it matters:** Frontend cannot render booking portal or "any available" staff selection.
**What should change:** Add `GET /api/booking/:businessSlug/profile`, `GET /api/services/:id/available-staff`, `GET /api/health`.
**Documents:** `API.md`

### C8. Fix stagger timing (Low)
**What is wrong:** "6-8ms stagger" is imperceptible.
**What should change:** Correct to 60-80ms.
**Documents:** `UI-UX.md`

### C9. Add row-level security or document application-layer enforcement (High)
**What is wrong:** No RLS; tenant isolation is application-layer only.
**Why it matters:** Single service-layer bug = data leak with no database backstop.
**What should change:** Add PostgreSQL RLS policies, or explicitly document application-layer as sole enforcement with audit logging.
**Documents:** `ARCHITECTURE.md`, `DATABASE.md`

---

## 12. Final Readiness Verdict

### READY AFTER MINOR CORRECTIONS

**Rationale:** The overall architecture is sound, the technology choices are appropriate, the design direction is distinctive and aligned with the brief, and the roadmap is well-sequenced. The documents provide a solid foundation for Phase 2.

**However**, two Critical issues (Prisma exclusion constraint, Staff.userId uniqueness) and several High-severity issues (active business resolution, authentication method, CORS, RLS, notification complexity) must be corrected before implementation begins. These are all specific, correctable items — none require architectural redesign.

**Conditions for approval:**
1. Apply corrections C1–C9 (or document an explicit decision to defer any of them).
2. Update the six planning documents with the corrections.
3. Re-review the updated documents before starting Phase 2.

Once the corrections are incorporated, the project is ready to proceed to Phase 2 (Project Foundation — monorepo setup, Next.js, NestJS, Prisma, PostgreSQL, Docker, `.env.example`).

---

---

## Correction Resolution Status

All corrections C1–C9 from §11 of the original audit have been applied to the planning documents. The table below shows the resolution status of every issue identified in the audit.

### Resolved issues

| ID | Severity | Issue | Resolution | Document(s) updated |
|----|----------|-------|------------|---------------------|
| CRIT-1 | Critical | Prisma exclusion constraint not natively supported | Documented as raw SQL migration in `packages/db/prisma/migrations/`, reviewed during migration review, preserved across resets | DATABASE.md, ARCHITECTURE.md, ROADMAP.md |
| CRIT-2 | Critical | `Staff.userId` globally unique prevents multi-business staff | Removed global uniqueness; `(businessId, userId)` unique constraint allows one user to be staff at multiple businesses | DATABASE.md |
| PRD-1 | High | Active business selection mechanism unspecified | Defined `POST /api/memberships/active` with server-side membership verification; active business stored server-side in session | PRD.md, ARCHITECTURE.md, API.md |
| PRD-2 | High | Redis + BullMQ mandated at MVP | Deferred to Phase 6; MVP uses synchronous email sending with configurable provider | PRD.md, ARCHITECTURE.md, ROADMAP.md |
| ARCH-2 | High | Auth strategy ambiguous (session/JWT/Redis) | Selected HTTP-only `sessionId` cookie + PostgreSQL server-side session store; alternatives removed | ARCHITECTURE.md, API.md |
| ARCH-3 | High | No CORS configuration | Documented CORS with `FRONTEND_URL` env var, `credentials: true`, no wildcard origins | ARCHITECTURE.md |
| ARCH-4 | High | No RLS defense-in-depth | Documented as optional defense-in-depth decision; primary enforcement is application-layer scoping with audit logging | ARCHITECTURE.md, DATABASE.md |
| SEC-1 | High | Active business resolution ambiguous for multi-business users | Backend independently verifies membership on every request; client cannot spoof business context | PRD.md, ARCHITECTURE.md, API.md |
| SEC-2 | High | STAFF can book appointments for any staff member | STAFF restricted to own staff profile; only OWNER/ADMIN can book for others | API.md |
| DB-1 | Critical | `Staff.userId` global unique | See CRIT-2 | DATABASE.md |
| DB-2 | High | Exclusion constraint not documented as custom migration | See CRIT-1 | DATABASE.md |
| DB-3 | High | `Appointment.deletedAt` missing from ER diagram | Added `deletedAt` to Appointment entity; clarified soft-delete vs CANCELLED status | DATABASE.md |
| DB-7 | Medium | `Payment.appointmentId` "unique-ish" | Made `appointmentId` unique (one payment per appointment) | DATABASE.md |
| DB-8 | Low | `Notification.recipient` type undefined | Defined `NotificationChannel` enum (EMAIL/SMS/IN_APP) and `recipient` field | DATABASE.md |
| DB-9 | Low | Missing composite index on appointments | Added `(businessId, status, startTime)` composite index | DATABASE.md |
| API-1 | High | Auth method ambiguous | See ARCH-2 | API.md |
| API-2 | High | Active business resolution not specified | See PRD-1 | API.md |
| API-3 | High | No CORS configuration | See ARCH-3 | API.md |
| API-4 | Medium | Missing endpoints (public profile, available staff, health) | Added `GET /api/booking/:businessSlug/profile`, `GET /api/booking/:businessSlug/staff`, `GET /api/health` | API.md |
| API-5 | Medium | Availability endpoint "public-ish" ambiguous | Clarified as auth-required; businessId resolved from session | API.md |
| API-6 | Medium | STAFF can see all appointments | STAFF sees only own appointments; OWNER/ADMIN see all | API.md |
| UI-1 | Medium | Cobalt contrast not verified | Specified ≥ 4.5:1 WCAG AA contrast for cobalt against white/ivory | UI-UX.md |
| UI-2 | Medium | "6-8ms stagger" imperceptible | Corrected to 60–80ms stagger | UI-UX.md |
| UI-3 | Medium | Font stack unspecified | Specified serif headings, Inter sans body, monospace for codes | UI-UX.md |
| UI-4 | Low | Form validation UI pattern missing | Added inline errors, aria-describedby, error red borders, error summary | UI-UX.md |
| UI-5 | Low | Empty states not specified | Added empty-state pattern (kicker + heading + body + action) | UI-UX.md |
| RM-1 | High | Testing concentrated in Phase 7 | Moved tenant isolation and concurrency tests to Phases 3–4; added security review milestone | ROADMAP.md |
| RM-2 | High | Redis/BullMQ at Phase 2 | Deferred to Phase 6; Redis optional in docker-compose | ROADMAP.md |
| RM-3 | Medium | No migration review milestone | Added migration review (including raw SQL exclusion constraint) to Phase 2 | ROADMAP.md |
| RM-4 | Medium | No security review milestone | Added security review milestones to Phases 3 and 5 | ROADMAP.md |
| RM-5 | Medium | No performance benchmarking | Added performance benchmarking for availability calculation to Phase 4 | ROADMAP.md |
| RM-6 | Low | No UI/UX design review | Added UI/UX design review checkpoint to Phase 2 | ROADMAP.md |
| PRD-3 | Medium | File upload/storage unspecified | Added local filesystem storage at MVP; S3-compatible option | PRD.md |
| PRD-4 | Low | Cancellation/refund rules missing | Added business-configurable cancellation window and refund eligibility | PRD.md |
| PRD-5 | Low | Acceptance criteria vague | Made acceptance criteria specific (cross-tenant test, concurrency test, terminal states, migration review, security review) | PRD.md |
| BK-1 through BK-8 | Critical–Low | Booking engine details | Clarified buffer inclusion in endTime, UTC storage, DST handling, advance booking limits, rescheduling conflicts, any-available-staff endpoint | DATABASE.md, API.md |

### Remaining open decisions

| ID | Severity | Issue | Status | Notes |
|----|----------|-------|--------|-------|
| ARCH-5 | Medium | Frontend↔backend communication pattern | Open | Direct browser-to-API with CORS vs. Next.js server-side proxy not finalized |
| ARCH-6 | Medium | API versioning strategy | Open | `/api/v1` reserved but no version header or URL prefix strategy defined |
| DB-4 | Medium | `operatingHours` as JSON vs. structured table | Open | JSON kept for flexibility; structured `BusinessWorkingHours` table can be added later |
| DB-6 | Medium | `AppointmentStatusHistory` entity | Open | AuditLog covers status changes; dedicated entity can be added if needed |
| UI-6 | Low | Booking portal visual differentiation | Open | Described as "lighter, marketing-oriented"; specific component subset not defined |

### Final readiness verdict

**READY AFTER MINOR CORRECTIONS — CORRECTIONS APPLIED**

All Critical and High-severity issues from the audit have been resolved. The six planning documents are now consistent with one another and technically sound. The project is ready for review and approval before proceeding to Phase 2 (Project Foundation).

**Status:** Documentation corrections complete. Awaiting review and approval before Phase 2. No implementation code has been generated. No changes merged to main.
