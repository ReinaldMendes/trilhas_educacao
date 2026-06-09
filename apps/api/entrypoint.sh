#!/bin/sh
set -e

echo "🌿 Trilhas API starting..."
echo "   PORT=${PORT:-3001}  NODE_ENV=${NODE_ENV:-production}"

[ -z "$DATABASE_URL" ] && echo "❌ DATABASE_URL not set" && exit 1

# ── Wipe failed migration record directly in PostgreSQL ───
# The _prisma_migrations table has a failed '20260601000000_init' row.
# Delete it so db push runs cleanly. Safe to run every deploy.
echo "⏳ Clearing stale migration records..."
psql "$DATABASE_URL" -c \
  "DELETE FROM _prisma_migrations WHERE applied_steps_count = 0 OR finished_at IS NULL;" \
  2>/dev/null && echo "✅ Migration table cleaned" || echo "ℹ️  _prisma_migrations not found yet (first deploy)"

# ── Sync schema (idempotent, no migration history needed) ─
echo "⏳ Syncing database schema with db push..."
npx prisma db push --accept-data-loss --skip-generate
echo "✅ Database ready"

# ── Start server ──────────────────────────────────────────
echo "🚀 Starting on 0.0.0.0:${PORT:-3001}..."
exec node dist/server.js
