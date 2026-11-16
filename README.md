# ServeFlow

A production-grade, multi-tenant business operations and appointment booking platform built by Zentravi.

## Project Status

**Phase 2 — Project Foundation** (in progress)

Phase 1 (planning & architecture documentation) is complete and merged into `main`.

## Repository Structure

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
├── docs/                    # PRD, ARCHITECTURE, DATABASE, API, UI-UX, ROADMAP, AUDIT_REPORT
├── docker-compose.yml
├── package.json             # Root (turbo, workspaces)
├── turbo.json
├── .env.example
└── README.md
```

## Planning Documents

All planning documents are in `docs/`:

| Document | Purpose |
|----------|---------|
| `PRD.md` | Product requirements, target users, feature priorities, acceptance criteria |
| `ARCHITECTURE.md` | System architecture, auth, multi-tenancy, background jobs, security |
| `DATABASE.md` | Entity design, ER diagram, indexes, constraints, concurrency strategy |
| `API.md` | Endpoint specs, error envelope, authz matrix, OpenAPI setup |
| `UI-UX.md` | Design philosophy, color system, typography, components, layouts, motion |
| `ROADMAP.md` | 8-phase implementation plan with testing milestones |
| `AUDIT_REPORT.md` | Architecture audit findings and correction resolution status |

## Local Development

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose (for PostgreSQL)
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 4. Set up the database

```bash
# Generate Prisma client (requires network access to download engines)
cd packages/db
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 5. Start the development servers

```bash
# From the repo root
npm run dev
```

This starts:
- Backend (NestJS) at `http://localhost:4000`
- Frontend (Next.js) at `http://localhost:3000`
- Swagger docs at `http://localhost:4000/api/v1/docs`

### 6. Using Docker Compose

```bash
docker compose up
```

This starts PostgreSQL, the API, and the web frontend.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all apps in dev mode |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run type-check` | TypeScript check all workspaces |
| `npm run test` | Run all tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |

## Phase Boundaries

- **Phase 2 (current):** Project foundation — monorepo setup, Next.js, NestJS, Prisma, PostgreSQL, Docker, `.env.example`
- **Phase 3:** Authentication and onboarding
- **Phase 4:** Core business management
- **Phase 5:** Booking platform (public portal)
- **Phase 6:** Business operations (notifications, payments, analytics, super-admin)
- **Phase 7:** Testing and hardening
- **Phase 8:** Portfolio preparation

Redis and BullMQ are intentionally deferred to Phase 6.

## Architecture Highlights

- **Multi-tenant:** Single PostgreSQL database with `businessId` scoping on all tenant tables
- **Auth:** HTTP-only `sessionId` cookie with PostgreSQL server-side session store (Phase 3)
- **API:** `/api/v1` versioned NestJS REST API with Swagger at `/api/v1/docs`
- **Frontend:** Next.js App Router with Tailwind CSS, shadcn/ui, Framer Motion
- **Double-booking prevention:** `SERIALIZABLE` transactions + PostgreSQL `EXCLUDE USING gist` exclusion constraint
- **No JWT/Redis** at MVP
