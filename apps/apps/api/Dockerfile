# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# System deps necessários para Prisma + psql
RUN apk add --no-cache openssl postgresql-client

# Copia manifesto e instala TODAS as deps (incluindo devDeps para tsc + prisma CLI)
COPY apps/api/package.json ./
RUN npm install

# Copia schema Prisma e gera o client
COPY apps/api/prisma ./prisma
RUN npx prisma generate

# Copia source e tsconfig e compila
COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Runtime deps do sistema
RUN apk add --no-cache openssl postgresql-client

# Copia só o que é necessário em produção
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Entrypoint
COPY apps/api/entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Pasta para uploads locais
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
