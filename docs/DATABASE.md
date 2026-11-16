# ServeFlow — Database Design

**Version:** 1.0 (Phase 1 — Planning)  
**Status:** Draft  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Developed by:** Zentravi Engineering

---

## 1. Design principles

- **Single database, multi-tenant:** all businesses share one PostgreSQL database. Tenant isolation is enforced by `businessId` scoping on every business-owned table, plus application-layer authorization (never client-trusted IDs).
- **Timezone-aware:** all stored timestamps are `timestamptz` (UTC). Business operating hours and staff working hours are stored as local time-of-day relative to the business timezone; slot calculation converts to UTC for storage/comparison.
- **Correct relationships:** foreign keys, indexes on foreign keys, unique constraints where needed, sensible cascade rules (soft-delete preferred for audit safety; hard-cascade only for truly disposable data).
- **Timestamps:** `createdAt` and `updatedAt` on every entity.
- **Deletion policy:** soft-delete (`deletedAt`) on core business records (business, staff, service, customer, appointment) so history and audit trails survive; hard delete only for ephemeral tokens and verification codes.

---

## 2. Entity-relationship diagram (Mermaid)

```mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : "has"
    BUSINESS ||--o{ MEMBERSHIP : "has"
    BUSINESS ||--o{ STAFF : "employs"
    BUSINESS ||--o{ SERVICE : "offers"
    BUSINESS ||--o{ CUSTOMER : "serves"
    BUSINESS ||--o{ PAYMENT : "records"
    BUSINESS ||--o{ NOTIFICATION : "sends"
    BUSINESS ||--o{ AVAILABILITY_EXCEPTION : "defines"
    BUSINESS ||--o{ APPOINTMENT : "books"

    MEMBERSHIP }o--|| USER : "links to"
    MEMBERSHIP }o--|| BUSINESS : "links to"

    STAFF }o--|| BUSINESS : "belongs to"
    STAFF ||--o{ STAFF_SERVICE : "performs"
    STAFF ||--o{ STAFF_WORKING_HOURS : "has"
    STAFF ||--o{ STAFF_TIME_OFF : "takes"
    STAFF ||--o{ APPOINTMENT : "serves"

    SERVICE }o--|| BUSINESS : "belongs to"
    SERVICE ||--o{ STAFF_SERVICE : "performed by"
    SERVICE ||--o{ APPOINTMENT : "booked as"

    CUSTOMER }o--|| BUSINESS : "belongs to"
    CUSTOMER ||--o{ APPOINTMENT : "makes"

    APPOINTMENT }o--|| BUSINESS : "belongs to"
    APPOINTMENT }o--|| CUSTOMER : "made by"
    APPOINTMENT }o--|| STAFF : "served by"
    APPOINTMENT }o--|| SERVICE : "booked for"
    APPOINTMENT ||--|{ PAYMENT : "has"
    APPOINTMENT ||--|{ NOTIFICATION : "triggers"

    STAFF_SERVICE }o--|| STAFF : "staff"
    STAFF_SERVICE }o--|| SERVICE : "service"

    STAFF_WORKING_HOURS }o--|| STAFF : "staff"
    STAFF_TIME_OFF }o--|| STAFF : "staff"

    AVAILABILITY_EXCEPTION }o--|| BUSINESS : "business"
    AVAILABILITY_EXCEPTION ||--|{ APPOINTMENT : "affects"

    PAYMENT }o--|| BUSINESS : "business"
    PAYMENT }o--|| APPOINTMENT : "appointment"
    PAYMENT }o--|| CUSTOMER : "customer"

    USER {
        String id PK
        String email UK
        String passwordHash
        String name
        String imageUrl
        Boolean emailVerified
        DateTime emailVerifiedAt
        String emailVerificationToken
        DateTime emailVerificationTokenExpires
        String passwordResetToken
        DateTime passwordResetTokenExpires
        DateTime createdAt
        DateTime updatedAt
    }

    BUSINESS {
        String id PK
        String name
        String slug UK
        String email
        String phone
        String address
        String timezone
        String operatingHours JSON
        Boolean isPublicBookingEnabled
        String logoUrl
        BusinessStatus status
        DateTime createdAt
        DateTime updatedAt
        DateTime? deletedAt
    }

    MEMBERSHIP {
        String id PK
        String userId FK
        String businessId FK
        MembershipRole role
        DateTime createdAt
    }

    STAFF {
        String id PK
        String businessId FK
        String userId FK
        String name
        String email
        String phone
        String role
        String bio
        String imageUrl
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    STAFF_SERVICE {
        String id PK
        String staffId FK
        String serviceId FK
        DateTime createdAt
    }

    STAFF_WORKING_HOURS {
        String id PK
        String staffId FK
        Int dayOfWeek 0-6
        Time startTime
        Time endTime
        Boolean isWorking
        DateTime createdAt
    }

    STAFF_TIME_OFF {
        String id PK
        String staffId FK
        DateTime startTime
        DateTime endTime
        String reason
        DateTime createdAt
    }

    SERVICE {
        String id PK
        String businessId FK
        String name
        String description
        Decimal price
        Int durationMinutes
        Int bufferMinutes
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    CUSTOMER {
        String id PK
        String businessId FK
        String name
        String email UK (per business)
        String phone
        String notes
        DateTime createdAt
        DateTime updatedAt
    }

    APPOINTMENT {
        String id PK
        String businessId FK
        String customerId FK
        String staffId FK
        String serviceId FK
        DateTime startTime
        DateTime endTime
        AppointmentStatus status
        Decimal price
        String? customerName
        String? customerEmail
        String? customerPhone
        String notes
        DateTime createdAt
        DateTime updatedAt
        DateTime? cancelledAt
        String? cancellationReason
        DateTime? deletedAt
    }

    PAYMENT {
        String id PK
        String businessId FK
        String appointmentId FK UK
        String customerId FK
        Decimal amount
        String currency
        PaymentStatus status
        String? provider
        String? providerPaymentId
        DateTime createdAt
        DateTime updatedAt
    }

    NOTIFICATION {
        String id PK
        String businessId FK
        String appointmentId FK
        NotificationChannel channel  // EMAIL | SMS | IN_APP
        String recipient            // email address, phone number, or userId depending on channel
        NotificationType type       // BOOKING_CONFIRMATION | APPOINTMENT_UPDATE | CANCELLATION | REMINDER | BUSINESS_ALERT
        String subject
        String content
        NotificationStatus status   // PENDING | SENT | FAILED
        DateTime sentAt
        DateTime createdAt
    }

    AVAILABILITY_EXCEPTION {
        String id PK
        String businessId FK
        DateTime startTime
        DateTime endTime
        String title
        Boolean isClosed
        DateTime createdAt
    }

    AUDIT_LOG {
        String id PK
        String businessId FK
        String userId FK
        String action
        String entityType
        String entityId
        String oldValues JSON
        String newValues JSON
        String ipAddress
        String userAgent
        DateTime createdAt
    }
```

---

## 3. Entity details

### 3.1 User
Platform-level account. One user can belong to multiple businesses via memberships.

- `email` is unique globally (login identifier).
- `passwordHash` — bcrypt.
- `emailVerificationToken` / `passwordResetToken` — single-use, time-limited.

### 3.2 Business
The tenant. Every business-owned record references `businessId`.

- `slug` — unique, used for public booking portal URLs (e.g. `serveflow.app/b/{slug}`).
- `operatingHours` — JSON map of day-of-week (0–6) → array of open/close intervals `{ open: "HH:MM", close: "HH:MM" }`. All times are local to `timezone`.
- `timezone` — IANA zone (e.g. `Asia/Kolkata`). All stored timestamps are UTC (`timestamptz`); slot calculation converts business-local operating hours to UTC for comparison.
- `status` — `ACTIVE` | `SUSPENDED` | `CLOSED`.
- `deletedAt` — soft delete.

### 3.3 Membership
Links User → Business with a role: `OWNER` | `ADMIN` | `STAFF` | `VIEWER`.

- `(userId, businessId)` unique — prevents duplicate memberships.

### 3.4 Staff
Employee profile within a business. Optional link to a `User` account (staff who log in).

- `userId` links to a platform `User` account. A single user may hold staff profiles at multiple businesses; uniqueness is enforced on `(businessId, userId)` rather than `userId` alone, so one user account can be staff at more than one business.
- `isActive` — whether staff can take new bookings.

### 3.5 StaffService
Many-to-many: which services a staff member is qualified to perform.

### 3.6 StaffWorkingHours
Recurring weekly schedule: `dayOfWeek` (0–6), `startTime` (local time `HH:MM`), `endTime` (local time `HH:MM`), `isWorking` flag. All times are stored in the business's timezone and converted to UTC at slot-calculation time.

### 3.7 StaffTimeOff
One-off absences (vacation, sick, personal): `startTime` and `endTime` stored as UTC `timestamptz`. These override normal working hours for the affected period.

### 3.8 Service
Bookable offering: name, description, price, duration, optional booking buffer, active/inactive.

### 3.9 Customer
Directory entry per business. `email` unique within a business (not globally — same customer may appear at multiple businesses).

### 3.10 Appointment
The core booking record.

- `startTime` / `endTime` — UTC timestamps. `endTime` = `startTime` + service duration + service buffer. The buffer is included in the occupied interval so no other booking can start during the buffer period.
- `status` — `PENDING` | `CONFIRMED` | `COMPLETED` | `CANCELLED` | `NO_SHOW`.
- `price` — snapshot of service price at booking time.
- `customerName/Email/Phone` — snapshot for guest bookings (portal) where no customer record exists yet.
- `deletedAt` — soft-delete column present for schema consistency; appointments are logically removed by setting `status = CANCELLED` rather than hard-deleting, preserving history and audit trails.

### 3.11 Payment
Payment record linked to an appointment and customer. `status`: `PENDING` | `PAID` | `REFUNDED` | `FAILED`. Modular — provider fields optional.

### 3.12 Notification
Outbound notification record (email/SMS/in-app) tied to an appointment.

### 3.13 AvailabilityException
Business-level closures (holidays, emergencies): `startTime`/`endTime` stored as UTC `timestamptz`, `isClosed` flag, optional `title`. Overrides normal operating hours for the affected period. Times are converted from business-local to UTC at storage time.

### 3.14 AuditLog
Immutable append-only record of state-changing actions: who, what, when, old/new values, IP, user agent.

---

## 4. Indexing strategy

| Table | Index | Reason |
|-------|-------|--------|
| `user` | unique `email` | Login lookup |
| `membership` | `(userId, businessId)` unique | Membership lookup + dedupe |
| `membership` | `businessId` | List members of a business |
| `business` | unique `slug` | Public portal resolution |
| `staff` | `businessId` | Staff directory per business |
| `staff` | `(businessId, userId)` unique | One user account → one staff profile per business |
| `staff_service` | `(staffId, serviceId)` unique | Service assignment dedupe |
| `service` | `businessId` | Service catalog per business |
| `service` | `(businessId, isActive)` | Active services list |
| `customer` | `businessId` | Customer directory per business |
| `customer` | `(businessId, email)` unique | Customer lookup per business |
| `appointment` | `businessId` | All appointments for business |
| `appointment` | `(businessId, startTime)` | Calendar range queries |
| `appointment` | `(businessId, status, startTime)` | Dashboard filters by status + date |
| `appointment` | `(staffId, startTime)` | Staff schedule queries |
| `appointment` | `(customerId, businessId)` | Customer history |
| `payment` | `businessId` | Revenue queries |
| `payment` | `appointmentId` unique | One payment per appointment |
| `notification` | `businessId` | Notification list |
| `audit_log` | `businessId` | Audit trail per business |
| `availability_exception` | `businessId` | Business closures |
| `staff_time_off` | `staffId` | Staff absences |
| `staff_working_hours` | `staffId` | Staff weekly schedule |

---

## 5. Constraints & deletion behavior

- **Foreign keys:** all `businessId`, `userId`, `staffId`, `serviceId`, `customerId`, `appointmentId` references enforced with `ON DELETE CASCADE` where the child record has no meaning without the parent (e.g. `StaffService`, `StaffWorkingHours`, `StaffTimeOff`, `Payment`, `Notification`, `AuditLog`, `AvailabilityException`).
- **Appointments:** `ON DELETE SET NULL` / restrict delete; cancellations set `status = CANCELLED` rather than deleting, preserving history.
- **Users:** `ON DELETE CASCADE` to memberships; soft-delete preferred.
- **Businesses:** soft-delete via `deletedAt`; hard delete only in admin tooling with cascade to dependent records.

---

## 6. Concurrency & double-booking prevention

### 6.1 Problem
Two concurrent requests may both see a slot as available and attempt to create the same appointment for the same staff member at the same time.

### 6.2 Booking interval, buffer, and timezone calculation

- **Service duration**: `durationMinutes` from the `Service` record.
- **Booking buffer**: `bufferMinutes` from the `Service` record. `endTime` = `startTime` + `durationMinutes` + `bufferMinutes`. The buffer is included in the occupied interval so no overlapping booking can start during the buffer.
- **Timezone storage**: All timestamps (`startTime`, `endTime`, `StaffTimeOff`, `AvailabilityException`) are stored as UTC `timestamptz`. Business operating hours and staff working hours are stored as local `HH:MM` relative to the business `timezone`.
- **Daylight-saving transitions**: Slot calculation converts business-local operating hours and staff working hours to UTC using the business `timezone` at calculation time. DST boundary shifts are handled by the timezone library during conversion; stored UTC values are unaffected.
- **Minimum/maximum advance booking**: `Business` settings include `bookingAdvanceMin` and `bookingAdvanceMax` (in hours) to prevent booking in the past or too far in the future.

### 6.3 Strategy

1. **Server-side availability recalculation** at booking time (never trust frontend-computed slots).
2. **Transaction with `SERIALIZABLE` isolation** (or `REPEATABLE READ` + explicit `SELECT ... FOR UPDATE` locking) around:
   - read existing appointments overlapping the requested `[startTime, endTime]` for the staff member,
   - verify none exist,
   - insert the new appointment.
3. **PostgreSQL exclusion constraint** (custom SQL migration, not declarable in Prisma schema):

```sql
ALTER TABLE "Appointment"
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    "staffId" WITH =,
    tstzrange("startTime", "endTime") WITH &&
  );
```

This constraint is managed as a raw SQL migration file in `packages/db/prisma/migrations/`. It is reviewed during migration review, applied via `prisma migrate deploy`, and preserved across `prisma migrate dev` resets by including it in the migration history. It is the database-level backstop: PostgreSQL itself rejects any overlapping appointment for the same staff, regardless of race conditions.

4. On conflict (exclusion violation or application-level conflict), return `409 Conflict` with a meaningful message ("This time slot is no longer available").

### 6.4 Rescheduling conflicts

Rescheduling cancels the old appointment (setting `status = CANCELLED`, freeing its time range) and creates the new appointment in the same transaction. The exclusion constraint prevents two rescheduling operations from colliding on the same freed slot — only one will succeed, the other receives `409 Conflict`.

### 6.5 Concurrent booking attempts

When two requests target the same staff slot simultaneously:
- Both enter the transaction and check for overlaps.
- PostgreSQL's exclusion constraint (or `SELECT ... FOR UPDATE` locking) serializes them.
- Exactly one insert succeeds; the other receives a `409 Conflict`.

### 6.6 Testing

Integration tests cover: concurrent booking requests, exclusion constraint enforcement, rescheduling conflicts, DST boundary slot calculations, and buffer enforcement.

---

## 7. Status transitions (appointment)

Allowed transitions (server-validated state machine):

```
PENDING  → CONFIRMED
PENDING  → CANCELLED
PENDING  → NO_SHOW
CONFIRMED → COMPLETED
CONFIRMED → CANCELLED
CONFIRMED → NO_SHOW
```

COMPLETED, CANCELLED, NO_SHOW are terminal. Any other transition returns `409 Conflict`.

---

## 8. Seed data (demo)

Realistic fictional data for demonstration: one demo business ("Lumina Salon & Studio"), 4 staff, 8 services, 20 customers, 30 appointments across statuses, payments, notifications. Clearly marked as seed data — not real customer information.

---

## 9. Migrations

Prisma migrations live in `packages/db/prisma/migrations/`. Each migration is reviewed and applied via `prisma migrate deploy` in CI and locally in dev. No manual `CREATE TABLE` outside Prisma.
