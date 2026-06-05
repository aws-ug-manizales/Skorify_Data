#!/usr/bin/env bash
# Smoke test for the local database stack:
# starts Postgres in Docker, runs pending migrations, prints status, then tears down.
#
# Usage (from repo root):
#   bash infra/.claude/skills/run-db-stack/smoke.sh [--keep]
#
# --keep  Leave postgres running after the script (useful for manual inspection).

set -euo pipefail

KEEP=false
[[ "${1:-}" == "--keep" ]] && KEEP=true

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"  # Skorify_Data/

# Connection defaults matching docker-compose defaults
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=polla_mundial
export DB_USER=postgres
export DB_PASSWORD=password

cleanup() {
  if ! "$KEEP"; then
    echo "[db] tearing down..."
    (cd "$ROOT" && pnpm run db:down 2>&1 | tail -3)
  else
    echo "[db] left running (--keep). Stop with: pnpm run db:down"
  fi
}
trap cleanup EXIT

echo "=== db-stack smoke test ==="

# ── 1. Start postgres ────────────────────────────────────────────────────────
echo "[db] starting postgres..."
(cd "$ROOT" && pnpm run db:up 2>&1 | tail -3)

# ── 2. Migration status (before) ────────────────────────────────────────────
echo ""
echo "[migrations] current status:"
(cd "$ROOT" && npx knex --knexfile knexfile.js migrate:status)

# ── 3. Run pending migrations ────────────────────────────────────────────────
echo ""
echo "[migrations] running migrate:latest..."
(cd "$ROOT" && npx knex --knexfile knexfile.js migrate:latest)

# ── 4. Status (after) ────────────────────────────────────────────────────────
echo ""
echo "[migrations] final status:"
(cd "$ROOT" && npx knex --knexfile knexfile.js migrate:status)

echo ""
echo "=== db-stack smoke OK ==="
