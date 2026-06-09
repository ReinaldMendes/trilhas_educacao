#!/bin/sh
# Don't use set -e — we want to continue even if psql fails

echo "=========================================="
echo " Trilhas da Infância API — Entrypoint"
echo " PORT=${PORT:-3001}"
echo " NODE_ENV=${NODE_ENV:-production}"
echo "=========================================="

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL not set — cannot start"
  exit 1
fi

echo "[1/3] Cleaning stale migration records in DB..."
psql "$DATABASE_URL" \
  -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL;" \
  2>&1 && echo "      OK" || echo "      Skipped (table may not exist yet — that's fine)"

echo "[2/3] Syncing schema with prisma db push..."
npx prisma db push --accept-data-loss --skip-generate 2>&1
echo "      Done"

echo "[3/3] Launching Node server..."
exec node dist/server.js
