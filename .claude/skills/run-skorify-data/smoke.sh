#!/usr/bin/env bash
# Smoke test for the skorifydata library via the dev-server.
# Launches the Express dev-server (no DB needed for structural endpoints),
# runs curl checks, then stops.
#
# Usage: bash .claude/skills/run-skorify-data/smoke.sh [--with-db]
#
# --with-db  Also starts PostgreSQL via Docker and runs entity endpoint checks.

set -euo pipefail

WITH_DB=false
[[ "${1:-}" == "--with-db" ]] && WITH_DB=true

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"   # repo root
DEV_SERVER="$ROOT/dev-server"
LOG=/tmp/skorify-dev.log
PORT=3000

cleanup() {
  [[ -n "${SERVER_PID:-}" ]] && kill "$SERVER_PID" 2>/dev/null || true
  "$WITH_DB" && (cd "$ROOT" && pnpm run db:down --remove-orphans 2>/dev/null) || true
}
trap cleanup EXIT

echo "=== skorify-data smoke test ==="

# ── 1. DB (optional) ────────────────────────────────────────────────────────
if "$WITH_DB"; then
  echo "[db] starting postgres..."
  (cd "$ROOT" && pnpm run setup)
fi

# ── 2. Build (if dist is stale or missing) ──────────────────────────────────
if [[ ! -f "$ROOT/dist/lib/index.js" ]]; then
  echo "[build] compiling library..."
  (cd "$ROOT" && pnpm run build)
fi

# ── 3. Launch dev-server ────────────────────────────────────────────────────
echo "[server] starting dev-server on :$PORT..."
(cd "$DEV_SERVER" && node_modules/.bin/tsx server.ts) &> "$LOG" &
SERVER_PID=$!

# Wait for readiness (up to 15 s)
for i in $(seq 1 30); do
  curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "http://localhost:$PORT/health" > /dev/null || { echo "FAIL: server did not start"; cat "$LOG"; exit 1; }
echo "[server] up (PID $SERVER_PID)"

# ── 4. Structural checks (no DB required) ───────────────────────────────────
echo ""
echo "--- /health"
curl -s "http://localhost:$PORT/health"
echo ""

echo "--- /exports"
curl -s "http://localhost:$PORT/exports"
echo ""

echo "--- /dbclient-shape"
curl -s "http://localhost:$PORT/dbclient-shape"
echo ""

# ── 5. Entity checks (DB required) ──────────────────────────────────────────
if "$WITH_DB"; then
  echo "--- /users (DB)"
  curl -s "http://localhost:$PORT/users"
  echo ""

  echo "--- /tournaments (DB)"
  curl -s "http://localhost:$PORT/tournaments"
  echo ""
fi

echo ""
echo "=== smoke OK ==="
