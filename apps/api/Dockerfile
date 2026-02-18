FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ─── Prune stage: isolate the api package ───────────────────────────────────
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo prune api --docker

# ─── Deps stage: install pruned dependencies ────────────────────────────────
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ─── Build stage: compile TypeScript ────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm dlx turbo build --filter=api

# ─── Production deps: install only runtime dependencies ─────────────────────
FROM base AS prod-deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Use --shamefully-hoist to flatten node_modules (no symlinks)
RUN pnpm install --frozen-lockfile --prod --shamefully-hoist

# ─── Runner stage: lean production image ────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package.json
COPY --from=builder /app/apps/api/package.json ./package.json

# Copy production node_modules (flattened, no symlinks)
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy compiled output
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 5000
CMD ["node", "dist/main.js"]