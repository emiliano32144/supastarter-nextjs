# ─── Base ────────────────────────────────────────────────────────────
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# ─── Dependencies ────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copiar manifestos del monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/api/package.json ./packages/api/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# ─── Builder ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY . .

# Generar Prisma client
RUN cd packages/database && pnpm prisma generate

# Build con turbo
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo build

# ─── Runner ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Necesitamos pnpm para ejecutar
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Copiar solo lo necesario para ejecutar
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps

# El build de Next.js está en apps/web/.next
# Prisma client necesita estar regenerado o copiado
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
RUN cd packages/database && pnpm prisma generate

EXPOSE 3000

CMD ["pnpm", "--filter", "@repo/web", "start"]
