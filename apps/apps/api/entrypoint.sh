#!/bin/sh
set -e

echo "=========================================="
echo " Trilhas da Infância API — Entrypoint"
echo " PORT=${PORT:-3001}"
echo " NODE_ENV=${NODE_ENV:-production}"
echo "=========================================="

if [ -z "$DATABASE_URL" ]; then
  echo "FATAL: DATABASE_URL not set — cannot start"
  exit 1
fi

echo "[1/2] Sincronizando schema com prisma db push..."
npx prisma db push --accept-data-loss --skip-generate
echo "      Done"

echo "[2/2] Iniciando servidor Node..."
exec node dist/server.js
