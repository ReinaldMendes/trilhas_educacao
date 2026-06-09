#!/bin/sh
set -e

echo "🌿 Trilhas API starting..."
echo "   PORT: ${PORT:-3001}"
echo "   NODE_ENV: ${NODE_ENV:-production}"
echo "   DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo yes || echo NO - MISSING)"

# ── Database setup ────────────────────────────────────────
# Strategy: use ONLY prisma db push (idempotent, safe to run on existing DB)
# This avoids migration history conflicts entirely.
#
# If there's a stuck migration in _prisma_migrations table, resolve it first.
echo "⏳ Resolving any stuck migrations..."
npx prisma migrate resolve --rolled-back 20260601000000_init 2>/dev/null || true

echo "⏳ Syncing database schema..."
npx prisma db push --accept-data-loss --skip-generate
echo "✅ Database ready"

# ── Start server ──────────────────────────────────────────
echo "🚀 Starting server on 0.0.0.0:${PORT:-3001}..."
exec node dist/server.js
