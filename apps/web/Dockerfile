# ServeFlow Web — Multi-stage Docker build
# Build context: repository root

# ── Stage 1: Dependencies ──────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Install package manager files from root workspace
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install all workspace dependencies (including dev for build)
RUN npm install --ignore-scripts

# ── Stage 2: Build ─────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN npm install --ignore-scripts

# Copy all source files
COPY . .

# Build all workspace packages needed by web
RUN npx turbo run build

# ── Stage 3: Runtime ───────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Next.js standalone output is self-contained: it includes its own
# minimal node_modules, the server entry point, and build output.
# outputFileTracingRoot is set to the monorepo root, so the standalone
# directory preserves the relative path from root (web/), giving
# web/server.js at the image root.
COPY --from=build /app/apps/web/.next/standalone ./

EXPOSE 3000

# Server entry point: standalone output places server.js at web/server.js
# relative to image root (matching outputFileTracingRoot = monorepo root).
CMD ["node", "web/server.js"]
