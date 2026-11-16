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

# Build workspace packages needed by web
RUN npx turbo run build --filter=@serveflow/web!...

# ── Stage 3: Runtime ───────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN npm install --omit=dev --ignore-scripts

# Copy built artifacts from build stage
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/config/dist ./packages/config/dist
COPY --from=build /app/packages/ui/dist ./packages/ui/dist
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "apps/web/.next/standalone/server.js"]
