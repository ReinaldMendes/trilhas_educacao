#!/bin/sh
set -e

echo "🌿 Trilhas API starting..."
echo "   PORT: ${PORT:-3001}"
echo "   NODE_ENV: ${NODE_ENV:-development}"

# Run prisma db push in background FIRST so server can start immediately
# This prevents healthcheck timeout during DB schema sync
echo "⏳ Running database schema sync in background..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 &
DB_PUSH_PID=$!

# Start server immediately so healthcheck passes
echo "🚀 Starting server..."
node dist/server.js &
SERVER_PID=$!

# Wait for db push to complete
wait $DB_PUSH_PID
DB_EXIT=$?
if [ $DB_EXIT -ne 0 ]; then
  echo "⚠️  prisma db push failed with code $DB_EXIT — server may work if tables already exist"
else
  echo "✅ Database schema synced"
fi

# Wait for server process
wait $SERVER_PID
