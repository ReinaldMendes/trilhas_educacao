FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ── Install dependencies ──────────────────────────────────
FROM base AS deps
COPY package.json ./
# Use --ignore-scripts to skip Prisma postinstall (done separately)
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

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# Create uploads dir
RUN mkdir -p uploads

EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
