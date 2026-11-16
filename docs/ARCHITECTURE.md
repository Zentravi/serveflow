# ServeFlow — Architecture Document

**Version:** 1.0 (Phase 1 — Planning)  
**Status:** Draft  
**Developed by:** Zentravi Engineering

---

## 1. System overview

ServeFlow is a modular monolith composed of:

- **Frontend** — Next.js App Router (React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion). Serves three interfaces from one app: the business dashboard, the public customer booking portal, and the protected super-admin interface.
- **Backend** — NestJS REST API with Swagger/OpenAPI documentation. Modular monolith: one deployable unit, cleanly separated domain modules.
- **Database** — PostgreSQL with Prisma ORM. Single database, schema-per-concern with tenant-scoped tables.
- **Cache / job queue** — Redis + BullMQ deferred to Phase 6; not a Phase 2 / MVP dependency.
- **Infrastructure** — Docker + docker-compose for local dev; GitHub Actions for CI.

Frontend and backend live in separate applications within a monorepo. No microservices are introduced unnecessarily.

---

## 2. Monorepo structure

```
serveflow/
├── apps/
│   ├── web/                 # Next.js frontend (dashboard + booking portal + super-admin)
│   └── api/                 # NestJS backend (REST + Swagger)
├── packages/
│   ├── config/              # Shared eslint, tsconfig, tailwind presets
│   ├── ui/                  # Shared shadcn/ui component library
│   ├── db/                  # Shared Prisma schema + migrations
│   └── types/               # Shared TypeScript types (DTOs, enums)
├── docs/                    # PRD, ARCHITECTURE, DATABASE, API, UI-UX, ROADMAP
├── docker/
│   ├── postgres/
│   └── redis/          # optional; added in Phase 6 with BullMQ
├── docker-compose.yml
├── package.json             # Root (turbo, workspaces)
├── turbo.json
├── .env.example
└── README.md
```

**Why a monorepo:** shared types between frontend and backend keep API contracts in sync; shared UI kit keeps the dashboard, booking portal, and super-admin visually consistent; single lint/tsconfig/CI setup reduces ops overhead.

---

## 3. Application boundaries

### 3.1 Frontend (`apps/web`)

Next.js App Router with route groups to separate the three interfaces:

```
app/
├── (dashboard)/             # Business dashboard (auth + business membership required)
│   ├── layout.tsx           # Sidebar + top nav
│   ├── dashboard/           # Overview
│   ├── appointments/        # Calendar + appointment management
│   ├── customers/           # Customer directory
│   ├── services/            # Service management
│   ├── staff/               # Staff management
│   ├── settings/            # Business settings
│   ├── payments/            # Payment records
│   └── notifications/       # Notifications
├── (booking)/               # Public customer booking portal (no auth)
│   ├── [businessSlug]/      # Business booking page
│   │   ├── services/
│   │   ├── book/
│   │   └── confirmation/
│   └── ...
├── (super-admin)/           # Protected platform admin (super-admin role)
│   ├── businesses/
│   ├── users/
│   ├── stats/
│   └── audit/
├── (auth)/                  # Login, register, password recovery
│   ├── login/
│   ├── register/
│   └── ...
├── layout.tsx               # Root layout (providers, fonts)
├── page.tsx                 # Marketing landing
└── globals.css              # Design-system tokens
```

- **Business dashboard** — server-authenticated pages; business context resolved from the user's active membership.
- **Booking portal** — fully public; resolves business by subdomain/slug from the URL.
- **Super-admin** — guarded by a `SUPER_ADMIN` role check in middleware.

### 3.2 Backend (`apps/api`)

NestJS modular monolith:

```
src/
├── auth/                    # Registration, login, logout, password reset, email verification
├── users/                   # User profiles
├── businesses/              # Business CRUD, operating hours, settings
├── memberships/             # Business memberships, roles, invitations
├── staff/                   # Staff profiles, working hours, time off
├── services/                # Service catalog
├── customers/               # Customer directory
├── appointments/            # Booking engine, availability, status transitions
├── payments/                # Payment records
├── notifications/           # Notification preferences + BullMQ producers
├── audit/                   # Audit log reader
├── admin/                   # Super-admin platform operations
├── common/                  # Guards, decorators, DTO base classes, exceptions, logging
├── config/                  # Environment validation (Zod / class-validator)
└── main.ts                  # Bootstrap + Swagger setup
```

Each module owns: controller (HTTP), service (business logic), repository/Prisma access, DTOs (Zod + class-validator), guards (authorization).

---

## 4. Frontend ↔ backend communication

- REST over HTTPS/HTTP. JSON request/response bodies.
- **API versioning:** All endpoints are versioned as `/api/v1` from the first endpoint.
- Standardized error envelope:

```json
{
  "statusCode": 400,
  "message": ["validation error details"],
  "error": "Bad Request",
  "timestamp": "2026-11-15T18:00:00Z",
  "path": "/appointments"
}
```

- **Domain arrangement:** Frontend (Next.js) and backend (NestJS) run on separate origins:
  - Frontend: `web.serveflow.app` (or `localhost:3000` in dev)
  - Backend: `api.serveflow.app` (or `localhost:4000` in dev)
  - The browser makes direct cross-origin requests from the frontend to the backend with `credentials: 'include'` so the `sessionId` cookie is sent.
  - Local development: both `localhost:3000` and `localhost:4000` resolve to `localhost` (same origin for cookie purposes); CORS allows `http://localhost:3000`.
- Authentication: HTTP-only, secure session cookie (`sessionId`). Token stored in cookies, never in localStorage.
- **Cookie behavior for same-site cross-origin requests:** Frontend (`web.serveflow.app`) and backend (`api.serveflow.app`) are different origins but the **same site** (`serveflow.app`). The `sessionId` cookie is set with `SameSite=Lax; Secure; HttpOnly`, so it is sent on same-site cross-origin requests (e.g., `web.serveflow.app` → `api.serveflow.app`) but not on cross-site requests. `SameSite=None` is not required because the domains are same-site, not cross-site.
- **CORS:** NestJS backend configures CORS to allow requests only from the configured frontend origin(s) (`FRONTEND_URL` env var), with `credentials: true` so cookies are sent. No wildcard origins.
- Business context: resolved server-side from the authenticated user's active membership; never from a client-supplied `businessId`.
- OpenAPI/Swagger docs served at `/api/v1/docs` (backend) for contract visibility.

---

## 5. Authentication & Session Management

**Chosen strategy:** HTTP-only session cookies with a server-side session store (PostgreSQL-backed, not Redis). A single `sessionId` cookie is issued on login and validated on every request.

- **Registration** → email verification required before full access (business creation or booking).
- **Login** → validate credentials; create a server-side session record; issue `sessionId` in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie; resolve the user's active business context server-side from membership.
- **Logout** → delete the server-side session record and clear the `sessionId` cookie.
- **Password recovery** → time-limited, single-use reset token emailed to the user; token expires after 1 hour.
- **Password hashing:** bcrypt with cost factor ≥ 10.
- **Cookie security:** `HttpOnly` (no JS access), `Secure` (HTTPS only), `SameSite=Lax` (same-site cross-origin requests send the cookie; cross-site requests do not, mitigating cross-site CSRF).
- **Session expiration:** sessions expire after 14 days of inactivity; absolute lifetime of 30 days.
- **Session renewal:** activity resets the inactivity timer; no separate refresh token is used.
- **CSRF protection:** `SameSite=Lax` prevents the cookie from being sent on cross-site requests, mitigating cross-site CSRF. However, same-site cross-origin requests (e.g., `web.serveflow.app` → `api.serveflow.app`) DO include the cookie, so additional CSRF protection is required for state-changing operations:
  1. **Origin/Referer validation:** The backend validates the `Origin` and/or `Referer` header on all state-changing requests (POST, PUT, PATCH, DELETE). Requests with missing, mismatched, or unexpected origins are rejected with `403`.
  2. **CSRF token (synchronizer pattern):** The server generates a cryptographically random CSRF token and stores it in the server-side session. The token is returned to the client in the login response (and refreshed on each session rotation). The frontend includes it as an `X-CSRF-Token` header on all state-changing requests. The backend compares the header value against the session-stored token. This is a **synchronizer token** pattern (server stores the token in the session), not a double-submit-cookie pattern (which would require a non-HttpOnly cookie and no server-side storage).
  3. **Credentials:** Browser requests include `credentials: 'include'` so the `sessionId` cookie is sent on same-site cross-origin requests to the backend API.
- **Rate limiting:** auth endpoints rate-limited (5 attempts/minute per IP); public booking endpoints rate-limited (30 requests/minute per IP).
- **Security headers:** CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.
- No passwords, API keys, or DB credentials hardcoded — all via environment variables.

---

## 6. Authorization & multi-tenancy

### 6.1 Tenant model

| Concept | Meaning |
|---------|---------|
| Business | A tenant (salon, studio, etc.). Owns services, staff, customers, appointments, payments, settings. |
| Membership | Links a `User` to a `Business` with a `Role` (`OWNER`, `ADMIN`, `STAFF`, `VIEWER`). |
| Role | Grants a set of permissions within that business only. |
| Platform role | `User.platformRole` (`SUPER_ADMIN` or `USER`). Platform-level, separate from MembershipRole. |

### 6.2 Enforcement rules

1. **Never trust client-supplied `businessId`.** The server resolves the business from the user's verified membership on every request.
2. **Active business selection:** A user may belong to multiple businesses. The frontend can request a business context (e.g., via `POST /api/memberships/active`), but the backend independently verifies the user's membership and permissions for that business on every request before resolving `businessId`. The active business is stored server-side (in the session), not derived from client input.
3. **Every tenant-scoped query adds `WHERE businessId = <resolved business id>`.** This is enforced by repository/service layer, not by the controller.
4. **Cross-business access is rejected** (403) even if the record ID is guessed.
5. **Super-admin** is a platform-level role (`User.platformRole = SUPER_ADMIN`), separate from business roles. Super-admin can read across tenants for platform operations; ordinary business users cannot. Super-admin authorization is enforced via `SuperAdminGuard` checking `platformRole`, independent of any business membership.
6. **Database-level tenant integrity:** Composite foreign keys prevent specific cross-business reference violations (e.g., an `Appointment` cannot reference `Staff`/`Service`/`Customer` from another business; `Payment`/`Notification` cannot reference appointments from another business). These are database-level defense-in-depth but do NOT replace application-layer authorization — tenant isolation is NOT fully database-enforced.
7. **Row-level security (RLS):** RLS on tenant-scoped tables is an optional defense-in-depth decision. The primary enforcement is application-layer scoping (rule 3). If RLS is adopted, PostgreSQL policies are added per table using `businessId` from the session context; otherwise, application-layer scoping with audit logging is the sole enforcement mechanism. This decision is reviewed during the security milestone in Phase 7.

### 6.3 Guards (NestJS)

- `AuthGuard` — authenticated user required.
- `RolesGuard` — required role(s) within the active business (`OWNER`, `ADMIN`, `STAFF`, `VIEWER`).
- `SuperAdminGuard` — platform super-admin only.
- `BusinessMembershipGuard` — user must be a member of the business they're accessing.

---

## 7. Background jobs

**MVP approach (deferred):** Redis + BullMQ are NOT required at MVP. Notification sending is handled synchronously within the request/response cycle using a configurable email provider (Resend/SendGrid/SMTP via env). If the provider is unconfigured, the notification attempt is logged and gracefully skipped — no fake sending claims.

**Future phase (Phase 6):** Redis + BullMQ introduced when background processing is needed for: appointment reminders (24h/1h before), cancellation notifications, business alerts, and high-volume email delivery. Audit log writes remain synchronous (in the same transaction) for audit integrity.

| Job (future) | Trigger | Handler |
|--------------|---------|---------|
| Send booking confirmation | Booking created | Email (configurable provider) |
| Appointment reminder | 24h / 1h before appointment | Email / SMS placeholder |
| Cancellation notification | Appointment cancelled | Email |
| Business alert | System/ops event | Email / in-app |
| Audit log write | State change | DB write (synchronous, always) |

---

## 8. Security architecture

| Layer | Controls |
|-------|----------|
| Transport | HTTPS/TLS; secure cookies |
| Auth | bcrypt passwords, HTTP-only session cookie, server-side session store (PostgreSQL), session expiration/renewal, rate limiting, email verification |
| AuthZ | Server-side role/membership checks; business-scoped queries; super-admin separation |
| Input | Zod + class-validator DTOs on every endpoint |
| Output | No sensitive data in frontend responses or logs; standardized error envelopes |
| Data | Tenant-scoped FKs, indexes, unique constraints, cascade rules |
| Observability | Structured logging, audit log, error monitoring integration points (Sentry-compatible DSN via env) |

---

## 9. Deployment & environments

- **Local:** `docker compose up` (PostgreSQL, api, web). Redis is optional and added in Phase 6 with BullMQ.
- **CI:** GitHub Actions — lint, type-check, unit tests, build.
- **Env config:** `.env.example` documents all required variables; `.env` is gitignored.
- No automatic deployment to production; this is a portfolio/engineering showcase.
