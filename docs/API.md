# ServeFlow — API Documentation

**Version:** 1.0 (Phase 1 — Planning)  
**Status:** Draft  
**Backend:** NestJS REST API  
**Docs:** Swagger/OpenAPI at `/api/docs`  
**Developed by:** Zentravi Engineering

---

## 1. Conventions

| Item | Convention |
|------|------------|
| Protocol | HTTPS / HTTP, JSON |
| Base path | `/api` |
| Auth | HTTP-only, Secure, SameSite=Lax `sessionId` cookie. Server-side session store (PostgreSQL). No tokens in URLs or localStorage. No JWT access/refresh pattern. |
| Business context | Resolved server-side from the caller's verified membership. Client-supplied `businessId` is ignored/untrusted for tenant-scoped resources. Active business is set via `POST /api/memberships/active` and validated server-side on every request. |
| Errors | Standard envelope (see §2). |
| Dates | ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`). |
| Pagination | `page` (default 1) and `limit` (default 20, max 100) query params; response includes `meta { total, page, limit, totalPages }`. |
| Versioning | Initial version unversioned (`/api/v1` reserved for future). |

---

## 2. Error response envelope

```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request",
  "timestamp": "2026-11-15T18:00:00.000Z",
  "path": "/api/auth/register"
}
```

- `400` — validation error (`message` is an array of field issues).
- `401` — unauthenticated.
- `403` — unauthorized / forbidden (tenant or role mismatch).
- `404` — not found.
- `409` — conflict (booking collision, invalid status transition, duplicate).
- `429` — rate limited.
- `500` — server error (generic message; details in server logs only).

---

## 3. Authentication endpoints

### POST /api/auth/register
Register a new user and optionally create a first business during onboarding.

**Body**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "businessName": "string",
  "businessSlug": "string",
  "timezone": "string"
}
```

**Response 201** `{ user: { id, email, name }, requiresEmailVerification: true }`

### POST /api/auth/login
**Body** `{ email, password }`  
**Response 200** `{ user, activeBusiness }` — sets `sessionId` HTTP-only cookie.

### POST /api/auth/logout
Deletes server-side session and clears `sessionId` cookie. **Response 204**.

### POST /api/auth/verify-email
**Body** `{ token }` — verifies email via time-limited token.

### POST /api/auth/forgot-password
**Body** `{ email }` — issues single-use password-reset token (emailed if provider configured).

### POST /api/auth/reset-password
**Body** `{ token, password }` — resets password using valid token.

---

## 4. Resource endpoints (tenant-scoped)

All endpoints below require authentication and an active business membership unless noted. Route parameter `:businessId` is resolved server-side from membership; clients should not send it.

### 4.1 Businesses

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/businesses/me` | Current user's active business | any member |
| PATCH | `/api/businesses/me` | Update business profile | OWNER, ADMIN |
| GET | `/api/businesses/me/operating-hours` | Operating hours | any member |
| PATCH | `/api/businesses/me/operating-hours` | Set operating hours | OWNER, ADMIN |
| GET | `/api/businesses/me/settings` | Notification/public-booking settings | any member |
| PATCH | `/api/businesses/me/settings` | Update settings | OWNER, ADMIN |

### 4.2 Memberships

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/memberships` | List members of active business | OWNER, ADMIN |
| POST | `/api/memberships` | Invite/add member | OWNER, ADMIN |
| PATCH | `/api/memberships/:id` | Change role | OWNER |
| DELETE | `/api/memberships/:id` | Remove member | OWNER |
| POST | `/api/memberships/active` | Set active business context (validates membership server-side) | any member |

### 4.3 Staff

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/staff` | List staff (filtered by business context) | any member |
| GET | `/api/staff/:id` | Staff detail | any member |
| POST | `/api/staff` | Create staff | OWNER, ADMIN |
| PATCH | `/api/staff/:id` | Update staff | OWNER, ADMIN |
| DELETE | `/api/staff/:id` | Deactivate staff | OWNER, ADMIN |
| GET | `/api/staff/:id/working-hours` | Weekly schedule | any member |
| PATCH | `/api/staff/:id/working-hours` | Set working hours | OWNER, ADMIN |
| POST | `/api/staff/:id/time-off` | Add time off | OWNER, ADMIN |

### 4.4 Services

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/services` | List services (filter active) | any member |
| GET | `/api/services/:id` | Service detail | any member |
| POST | `/api/services` | Create service | OWNER, ADMIN |
| PATCH | `/api/services/:id` | Update service | OWNER, ADMIN |
| DELETE | `/api/services/:id` | Deactivate service | OWNER, ADMIN |

### 4.5 Customers

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/customers` | List customers (search, paginate) | any member |
| GET | `/api/customers/:id` | Customer profile + history | any member |
| POST | `/api/customers` | Create customer | OWNER, ADMIN, STAFF |
| PATCH | `/api/customers/:id` | Update customer | OWNER, ADMIN, STAFF |
| DELETE | `/api/customers/:id` | Remove customer | OWNER, ADMIN |

### 4.6 Appointments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/appointments` | List (filter date, staff, status, search); STAFF sees only their own appointments | any member |
| GET | `/api/appointments/:id` | Detail | any member |
| POST | `/api/appointments` | Create; STAFF can only create appointments for their own staff profile | OWNER, ADMIN, STAFF |
| PATCH | `/api/appointments/:id` | Update / reschedule (cancels old slot, creates new in same transaction) | OWNER, ADMIN |
| PATCH | `/api/appointments/:id/status` | Change status (validated transitions) | OWNER, ADMIN, STAFF |
| DELETE | `/api/appointments/:id` | Cancel | OWNER, ADMIN |
| GET | `/api/appointments/availability` | Server-calculated available slots for a staff member on a date (dashboard/authenticated use). `businessId` resolved from session. | auth required |

Availability query params: `date`, `staffId`, `serviceId`. `businessId` resolved from the caller's active membership.

**Distinction from public booking availability:** `/api/appointments/availability` is for authenticated dashboard users managing appointments within their business context. `/api/booking/:businessSlug/availability` is for unauthenticated public booking portal users, where the business is resolved from the URL slug.

### Available staff discovery

| GET | `/api/services/:id/available-staff` | List staff members who offer this service and have availability on a given date | any member |

### 4.7 Public booking portal (unauthenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/booking/:businessSlug/profile` | Public business profile (name, slug, timezone, operating hours, services) |
| GET | `/api/booking/:businessSlug/services` | Public services for a business (active only) |
| GET | `/api/booking/:businessSlug/availability` | Public slots for date + service + optional staff |
| GET | `/api/booking/:businessSlug/staff` | Public staff list for a business (active, with services offered) |
| POST | `/api/booking/:businessSlug/appointments` | Create booking from portal |
| GET | `/api/booking/:businessSlug/appointments/:id/confirmation` | Booking confirmation view |

### 4.8 Payments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/payments` | List payment records | any member |
| GET | `/api/payments/:id` | Payment detail | any member |
| PATCH | `/api/payments/:id/status` | Update status | OWNER, ADMIN |

### 4.9 Notifications

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/notifications` | List notifications | any member |
| POST | `/api/notifications/preferences` | Set preferences | any member |

### 4.10 Audit logs

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/audit` | Read audit trail (filter, paginate) | OWNER, ADMIN |

### 4.11 Super-admin (platform-level; SUPER_ADMIN role only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/businesses` | List all tenants |
| PATCH | `/api/admin/businesses/:id/status` | Suspend/activate business |
| GET | `/api/admin/users` | Platform user list |
| GET | `/api/admin/stats` | Platform usage statistics |
| GET | `/api/admin/audit` | Cross-tenant audit log |

---

## 5. System endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check (database connectivity, service status) | None |

## 6. Request/response examples

### Create appointment (staff side)

**POST /api/appointments**
```json
{
  "customerId": "cus_123",
  "staffId": "staff_456",
  "serviceId": "svc_789",
  "startTime": "2026-11-20T10:00:00.000Z"
}
```

**201 Created**
```json
{
  "id": "appt_001",
  "businessId": "biz_abc",
  "customerId": "cus_123",
  "staffId": "staff_456",
  "serviceId": "svc_789",
  "startTime": "2026-11-20T10:00:00.000Z",
  "endTime": "2026-11-20T10:30:00.000Z",
  "status": "PENDING",
  "price": 45.00,
  "createdAt": "2026-11-15T18:00:00.000Z"
}
```

**409 Conflict** (slot taken)
```json
{
  "statusCode": 409,
  "message": ["This time slot is no longer available for the selected staff member."],
  "error": "Conflict",
  "timestamp": "...",
  "path": "/api/appointments"
}
```

### Public booking submission

**POST /api/booking/:businessSlug/appointments**
```json
{
  "serviceId": "svc_789",
  "staffId": "staff_456",
  "startTime": "2026-11-20T10:00:00.000Z",
  "customerName": "Aanya Rao",
  "customerEmail": "aanya@example.com",
  "customerPhone": "+91 98765 43210"
}
```

**201 Created** `{ appointment, confirmationUrl }`

---

## 6. Authorization requirements

| Endpoint class | Auth | Role | Tenant scope |
|----------------|------|------|--------------|
| `/api/auth/*` | No | — | No |
| `/api/booking/*` | No | — | By slug (public business) |
| `/api/businesses/me` | Yes | any member | Resolved from membership |
| `/api/staff/*`, `/api/services/*`, `/api/customers/*`, `/api/appointments/*` | Yes | per table above | Resolved from membership |
| `/api/memberships/*` | Yes | OWNER/ADMIN | Resolved from membership |
| `/api/admin/*` | Yes | SUPER_ADMIN | Platform-level (all tenants) |

Cross-tenant access attempt → `403`. Missing membership for the business → `403`.

**Super-admin authorization:** The `SUPER_ADMIN` role is a platform-level role stored on the `User.platformRole` field, separate from business-scoped `MembershipRole` (`OWNER`, `ADMIN`, `STAFF`, `VIEWER`). Super-admin endpoints (`/api/admin/*`) require `platformRole = SUPER_ADMIN` and are not scoped to any single business. A user can be `SUPER_ADMIN` without any business membership, or `USER` with business memberships. The two role systems are enforced independently: `SuperAdminGuard` checks `platformRole`; `RolesGuard` checks `MembershipRole` within the active business context.

---

## 7. OpenAPI/Swagger

- NestJS `nestjs/swagger` decorators on every controller and DTO.
- Swagger UI at `GET /api/docs` (dev/staging only; guarded in production).
- OpenAPI JSON at `GET /api/docs/json`.
- DTOs use `class-validator` + `class-transformer`; Zod schemas shared where frontend and backend need identical validation.
