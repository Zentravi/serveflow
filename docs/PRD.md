# ServeFlow — Product Requirements Document

**Product:** ServeFlow  
**Tagline:** Business operations, simplified.  
**Developed by:** Zentravi  
**Status:** Draft — Phase 1 (Planning & Architecture)  
**Owner:** Zentravi Product & Engineering

---

## 1. Overview

ServeFlow is a production-quality, multi-tenant SaaS business operations platform for appointment-based service providers — salons, barbershops, beauty studios, wellness studios, and similar businesses. It unifies customer, employee, service, appointment, schedule, and payment management into a single workspace, while giving customers a simple public booking portal.

The architecture is designed to be extensible to additional industries beyond beauty and wellness.

### Product promise

- Business owners manage customers, employees, services, appointments, schedules, and business performance in one place — not multiple disconnected tools.
- Customers independently discover services and book appointments through a dedicated public booking page.
- Everything feels like a real SaaS product, not a demo site: real persistence, real authorization, real validation, real data.

---

## 2. Target users

| User | Goals |
|------|-------|
| Business owner / manager | Run daily operations, view performance, manage staff and services, approve appointments. |
| Employee / staff member | View own schedule, mark appointments complete, manage availability. |
| Customer | Browse services, pick staff/date/time, book, receive confirmation, view booking status. |
| Platform super-admin | Manage tenants/businesses, users, platform health, audit activity, support operations. |

---

## 3. Problems & solutions

| Problem | Solution |
|---------|----------|
| Appointment businesses juggle disconnected tools for bookings, customers, staff, and payments. | A unified multi-tenant operations platform. |
| Double-bookings and scheduling conflicts cost revenue. | Server-side availability engine with transactional booking and DB-level conflict prevention. |
| Staff availability is hard to coordinate across shifts and time off. | Staff working-hours model, time-off exceptions, and server-validated slot calculation. |
| No-shows and cancellations go untracked. | Status lifecycle (Pending → Confirmed → Completed/Cancelled/No-show) with server-enforced transitions. |
| Business data must never leak between tenants. | Business-scoped records, membership-based access, server-side authorization, cross-tenant isolation tests. |
| Customers want a dead-simple booking experience. | A dedicated public booking portal with its own visual identity, consistent with the brand. |

---

## 4. Functional requirements

### FR-1: Multi-tenancy & access control
- Multiple businesses share the platform without accessing each other's data.
- Every business-owned record is scoped to its business (customers, appointments, staff, services, payments, settings).
- Membership-based access: users belong to businesses via memberships with roles.
- **Active business selection:** A user may belong to multiple businesses. The frontend can request a business context, but the backend independently verifies the user's membership and permissions for that business on every request before resolving `businessId`. The active business is stored server-side (in the session), never derived from client input.
- Server-side authorization on every endpoint; client-supplied business IDs are never trusted.
- Super-admin permissions are completely separate from ordinary business permissions.

### FR-2: Authentication
- Registration, login, logout, email verification, password recovery.
- Secure password hashing (bcrypt), secure session/token handling.
- Rate limiting on auth endpoints.

### FR-3: Business management
- Business profile, operating hours, timezone, public booking page configuration, notification preferences.
- Business logo and staff profile image storage (local filesystem at MVP; S3-compatible object storage as an option).
- Business creation during onboarding; account status management (active/suspended).

### FR-4: Service management
- Add/edit services: name, description, price, duration, active/inactive status, optional booking buffers.
- Services scoped to a business.

### FR-5: Staff management
- Employee profiles, roles, assigned services, working hours, availability, time-off management.

### FR-6: Customer management
- Customer directory, profiles, contact details, appointment history, notes, activity.

### FR-7: Appointment management
- Daily/weekly/monthly calendar views.
- Create, reschedule, cancel appointments; update statuses.
- Filter and search appointments.
- Appointment details view.

### FR-8: Booking engine
- Availability calculated server-side from business hours, staff hours, time off, existing appointments, service duration, buffers, business timezone, selected date.
- On booking submission: validate service, business, staff; recalculate availability server-side; verify slot; create booking transactionally; prevent overlapping bookings; return success or conflict.
- PostgreSQL constraints / transaction isolation / locking to prevent race conditions and double bookings.
- Allowed status transitions: Pending → Confirmed → Completed / Cancelled / No-show. No arbitrary invalid changes.

### FR-9: Customer booking portal (public)
- Open a business booking page.
- Browse services with descriptions and prices.
- Select a staff member or "any available."
- Select a date; view genuinely available time slots.
- Enter customer details; submit booking; receive confirmation; view booking status.

### FR-10: Payments
- Payment records, payment status, payment history, revenue summaries.
- Cancellation policy: business-configurable cancellation window (e.g., 24 hours before appointment); refund eligibility rules.
- Modular payment integration; no fake processing unless a real provider is configured.

### FR-11: Notifications
- Booking confirmations, appointment updates, cancellations, reminders, business alerts.
- Email provider integration configurable (Resend/SendGrid/SMTP via env).
- **MVP approach:** Notifications are sent synchronously within the request/response cycle. Redis + BullMQ background jobs are deferred to Phase 6 unless a clearly justified MVP requirement emerges. If the email provider is unconfigured, notification attempts are logged and gracefully skipped — no fake sending claims.

### FR-12: Analytics & insights
- Revenue over time, booking trends, popular services, customer retention, completion rates, staff utilization, cancellation rates.
- All metrics calculated from actual database records — no fake data.

### FR-13: Super-admin platform
- Business/tenant management, account status management, platform usage statistics, user management, operational monitoring, support operations, audit activity.

### FR-14: UI/UX & motion
- Light-theme, editorial, premium visual identity; not a generic dashboard template.
- Framer Motion page transitions, navigation, sidebar, staggered entrances, modals, dropdowns, calendar navigation, loading states, toasts, booking workflow transitions.
- Responsive: desktop, laptop, tablet, mobile.
- `prefers-reduced-motion` respected.

### FR-15: Observability & quality
- Structured logging, error monitoring integration points, audit logs.
- Jest, Supertest, Playwright test coverage.
- Docker, GitHub Actions CI.

---

## 5. Non-functional requirements

| Category | Requirement |
|----------|-------------|
| Security | OWASP-aligned, authN/authZ enforced server-side, secrets via env vars only, security headers, safe error handling. |
| Reliability | Transactional booking creation; DB constraints prevent double-booking; graceful degradation when email provider is unconfigured. |
| Performance | Server-side availability calculation; paginated lists; skeleton/loading states. |
| Accessibility | Keyboard navigation, focus management, ARIA labels, color contrast, reduced-motion support. |
| Maintainability | Strict TypeScript, no `any`, clear layer separation (presentation → logic → controller → service → DB), reusable components. |
| Observability | Structured logs, audit trail for state changes, error monitoring hooks. |

---

## 6. Feature priorities

**P0 (must have, delivered by end of Phase 6):** Multi-tenancy, auth, business/profile, services, staff, customers, appointments, booking engine with concurrency safety, public booking portal, payments tracking, notifications (synchronous, configurable provider), analytics from real data, super-admin, tests, Docker/CI. P0 features are implemented across Phases 2–6 and validated in Phase 7.

**P1 (should have, post-MVP):** Email/SMS notification provider integrations (BullMQ background jobs), advanced calendar views, recurring appointments, staff time-off calendar, export/reports.

**P2 (could have, later):** AI-powered business insights, SMS reminders, online payments (Stripe), multi-location businesses, mobile apps.

---

## 7. Acceptance criteria

- A new business can be created and its data is isolated from all other businesses (cross-tenant isolation test passes).
- A staff member cannot see or book appointments belonging to another business.
- A staff member can only create appointments for their own staff profile (not other staff members).
- Booking a slot creates a persisted appointment record; concurrent attempts to book the same slot result in exactly one success and one conflict error (409).
- Invalid appointment status transitions are rejected with a 409 error; terminal states (COMPLETED, CANCELLED, NO_SHOW) cannot be changed.
- Public booking portal shows only services for the queried business and only genuinely available, server-calculated slots.
- All metrics on the dashboard derive from real database records (verified against raw SQL queries).
- TypeScript compiles cleanly (`strict: true`); lint passes with zero warnings; unit, integration, API, and E2E tests pass.
- The app builds in Docker and runs via `docker compose up`.
- `.env.example` documents every required environment variable; no secrets are hardcoded.
- Migration review passes, including the raw SQL exclusion constraint for double-booking prevention.
- Security review passes: CORS, cookie security, rate limiting, and tenant isolation verified.
