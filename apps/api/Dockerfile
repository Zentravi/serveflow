# ServeFlow API — Multi-stage Docker build
# Build context: repository root

# ── Stage 1: Dependencies ──────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Install package manager files from root workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install all workspace dependencies (including dev for build)
RUN npm install --ignore-scripts

# Copy Prisma schema for client generation
COPY packages/db/prisma ./packages/db/prisma

# ── Stage 2: Build ─────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies (same as deps stage for layer caching)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN npm install --ignore-scripts

# Copy all source files
COPY . .

# Generate Prisma client (output goes to root node_modules/.prisma/)
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

# Build all workspace packages (types, config, db, ui) and the API
RUN npx turbo run build

# ── Stage 3: Runtime ───────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN npm install --omit=dev --ignore-scripts

# Copy built artifacts from build stage
# @serveflow/api imports @serveflow/types and @serveflow/db at runtime.
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/db/dist ./packages/db/dist

# Root node_modules includes the generated Prisma client (.prisma/client)
# produced by `prisma generate` in the build stage.
COPY --from=build /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "apps/api/dist/main"]
