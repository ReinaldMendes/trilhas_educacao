#!/bin/sh
set -e

echo "=========================================="
echo " Trilhas da Infância API"
echo " PORT=${PORT:-3001}"
echo " NODE_ENV=${NODE_ENV:-production}"
echo "=========================================="

# Validate required env vars
if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL is not set"
  exit 1
fi

echo "[1/3] Cleaning stale migration records..."
psql "$DATABASE_URL" \
  -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL;" \
  2>/dev/null \
  && echo "      Done" \
  || echo "      Skipped (table may not exist yet)"

echo "[2/3] Syncing database schema..."
npx prisma db push --accept-data-loss --skip-generate
echo "      Done"

echo "[3/3] Starting Node.js server..."
exec node dist/server.js
