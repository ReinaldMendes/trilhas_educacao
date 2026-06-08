FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

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
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
COPY entrypoint.sh ./

RUN mkdir -p uploads && chmod +x entrypoint.sh

# Railway injects $PORT dynamically — do NOT hardcode EXPOSE
# EXPOSE is just documentation; the actual port comes from $PORT env var

ENTRYPOINT ["./entrypoint.sh"]
