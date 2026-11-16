# ServeFlow — Implementation Roadmap

**Version:** 1.0 (Phase 1 — Planning)  
**Status:** Draft  
**Developed by:** Zentravi Engineering

---

## 1. Development phases

### Phase 1 — Product and architecture (current)
- [x] Inspect existing repository
- [x] PRD.md — product requirements, users, priorities, acceptance criteria
- [x] ARCHITECTURE.md — system architecture, boundaries, auth, multi-tenancy, background jobs, security
- [x] DATABASE.md — entity design, ER diagram, indexes, constraints, concurrency strategy
- [x] API.md — endpoint specifications, request/response formats, authz, OpenAPI setup
- [x] UI-UX.md — design philosophy, color system, typography, components, layouts, motion
- [x] ROADMAP.md — this document
- [ ] Proposed monorepo structure (see §2)
- [ ] Review of architecture & design with stakeholders before major implementation

### Phase 2 — Project foundation
- [ ] Monorepo root: `package.json` (workspaces + turbo), `turbo.json`, `.env.example`, Docker setup
- `packages/config` — shared eslint, tsconfig, tailwind presets
- `packages/ui` — shadcn/ui base with ServeFlow tokens
- `packages/db` — Prisma schema + migrations directory (including raw SQL exclusion constraint migration)
- `packages/types` — shared DTO/enum types
- `apps/api` — NestJS scaffold: config validation, logging, Swagger, middleware, error handling, CORS, session management
- `apps/web` — Next.js App Router scaffold: route groups, layout, providers, globals.css
- `docker-compose.yml` — PostgreSQL + api + web (Redis optional, added in Phase 6)
- [ ] Migration review (including raw SQL `appointment_no_overlap` exclusion constraint)
- [ ] TypeScript check, lint, build pass for all workspaces
- [ ] UI/UX design review checkpoint

### Phase 3 — Authentication and onboarding
- User registration with email verification
- Login / logout / password reset (HTTP-only session cookies, bcrypt)
- Business creation during onboarding (first business + owner membership)
- Membership + role model (OWNER, ADMIN, STAFF, VIEWER)
- Active business selection (`POST /api/memberships/active`, server-validated)
- Tenant isolation middleware (business resolved from membership, not client ID)
- Rate limiting on auth endpoints
- Security headers
- [ ] Unit + integration tests for auth
- [ ] Tenant isolation tests (cross-business access returns 403)
- [ ] Security review milestone: CORS, cookie security, session management verified

### Phase 4 — Core business management
- Services CRUD (price, duration, buffer, active/inactive)
- Staff profiles, roles, assigned services, working hours, time off
- Customer directory + profiles + notes
- Appointment management: create, reschedule, cancel, status transitions, filter/search
- Calendar (day/week/month) with server-validated availability
- Staff permission enforcement: STAFF sees only own appointments, books only for own profile
- [ ] Booking concurrency tests (exclusion constraint + serializable transaction)
- [ ] Status-transition validation tests
- [ ] Performance benchmarking for availability calculation

### Phase 5 — Booking platform (public portal)
- Public business profile by slug
- Service browsing with descriptions/prices
- Staff selection or "any available" (available-staff discovery endpoint)
- Date picker + genuinely available time slots (server-calculated)
- Customer details form + booking submission
- Conflict handling (409 → retry with different slot)
- Booking confirmation page + status view
- [ ] E2E test: full booking flow end to end
- [ ] Security review: public endpoint rate limiting verified

### Phase 6 — Business operations
- Notifications: booking confirmations, updates, cancellations, reminders (synchronous email sending, configurable provider)
- Redis + BullMQ introduced (if needed for high-volume email or reminder scheduling)
- Payment tracking: records, status, history, revenue summaries
- Analytics from real data: revenue over time, booking trends, popular services, retention, completion rates, staff utilization, cancellation rates
- Super-admin interface: business/tenant management, account status, platform stats, user management, audit logs
- Audit log writes on state changes (synchronous, in-transaction)
- [ ] Analytics accuracy verification (metrics match DB records)

### Phase 7 — Testing and hardening
- Unit tests (services, booking engine, status machine)
- Integration tests (API endpoints, tenant isolation)
- API tests (Supertest)
- End-to-end tests (Playwright): booking flow, dashboard flows, super-admin flows
- Cross-tenant isolation tests
- Booking concurrency tests
- Security checks (headers, rate limiting, auth, CORS, cookies)
- Accessibility checks (keyboard, focus, contrast, ARIA)
- Performance checks (availability calculation latency)
- [ ] All test suites pass; fixes applied

### Phase 8 — Portfolio preparation
- Realistic demo seed data (clearly fictional)
- Comprehensive README + setup instructions
- Architecture diagrams + ER diagram
- Database diagram
- Setup documentation (Docker, local dev, CI)
- Zentravi case study
- Demo instructions
- [ ] Final repo review: clone → configure → run → understand

---

## 2. Dependencies between phases

```
Phase 1 (docs) → Phase 2 (foundation + migration review + design review) → Phase 3 (auth + security review) → Phase 4 (core + concurrency tests) → Phase 5 (booking portal + security review)
                                                   ↓
                                            Phase 6 (operations + optional Redis/BullMQ) → Phase 7 (testing) → Phase 8 (portfolio)
```

Phase 2 must complete before Phase 3 (auth needs the API/web scaffold). Phase 3 must complete before Phase 4 (business-scoped resources need membership). Phase 4 must complete before Phase 5 (booking portal consumes availability engine).

---

## 3. Testing milestones

| Milestone | Phase | Criteria |
|-----------|-------|----------|
| Foundation build | 2 | `tsc`, `lint`, `build` pass in all workspaces |
| Migration review | 2 | Raw SQL exclusion constraint reviewed and preserved |
| UI/UX design review | 2 | Design spec approved before implementation |
| Auth correctness | 3 | Register/login/logout/reset/verify work; sessions secure |
| Tenant isolation | 3, 4 | Cross-business access returns 403; queries scoped by membership |
| Security review | 3, 5 | CORS, cookie security, rate limiting verified |
| Booking integrity | 4, 5 | Concurrency test: exactly one success per slot; exclusion constraint holds |
| Status machine | 4 | Invalid transitions rejected (409); terminal states enforced |
| Performance benchmarking | 4 | Availability calculation meets latency targets |
| E2E booking | 5 | Public portal booking creates appointment + confirmation |
| Analytics accuracy | 6 | Dashboard metrics match raw DB queries |
| Full test suite | 7 | Unit + integration + API + E2E all green |

---

## 4. Completion criteria (definition of done)

- Strict TypeScript compiles with no errors (`any` banned).
- ESLint passes with zero warnings treated as errors.
- Relevant unit/integration/e2e tests pass.
- Production builds succeed for `apps/web` and `apps/api`.
- `docker compose up` starts a working local stack.
- `.env.example` documents every required variable; no hardcoded secrets.
- Cross-tenant isolation verified by test.
- Booking concurrency verified by test.
- Responsive at mobile/tablet/laptop/desktop.
- `prefers-reduced-motion` respected.
- README enables another developer to clone, configure, run, and understand.

---

## 5. What is intentionally out of scope for this phase

- Real payment processing (Stripe, etc.) — payment tracking is modular; provider integration requires credentials and is marked as configurable.
- Redis + BullMQ at MVP — notifications are synchronous; background jobs deferred to Phase 6 unless clearly justified.
- AI-powered business insights — explicitly deferred (PRD §6 P2).
- SMS notifications — email-only first; SMS is a placeholder channel.
- Mobile applications — web-first responsive design.
- Automatic production deployment — this is a portfolio showcase.
