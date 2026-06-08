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

RUN mkdir -p uploads

EXPOSE 3001

# prisma db push: syncs schema to DB without needing migration history
# --accept-data-loss only needed if columns are removed (safe for initial deploy)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
