FROM node:20-alpine AS base
WORKDIR /app
# openssl for Prisma, postgresql-client for psql (used in entrypoint to clean migrations)
RUN apk add --no-cache openssl postgresql-client

# ── Install dependencies ──────────────────────────────────
FROM base AS deps
COPY package.json ./
RUN npm install --frozen-lockfile

# ── Generate Prisma client + Build TypeScript ─────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Production image ──────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY package.json ./
COPY entrypoint.sh ./

RUN mkdir -p uploads && chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
