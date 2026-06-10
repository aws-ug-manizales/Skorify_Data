---
name: run-skorify-data
description: Build, run, and smoke-test the skorifydata library and its dev-server. Use when asked to start, run, test, build, or verify the skorifydata library or dev-server.
---

`skorifydata` is a TypeScript data-access library (TypeORM + PostgreSQL). "Running" it means compiling the library and exercising it through the Express dev-server in `dev-server/`. Drive it via the smoke script at `.claude/skills/run-skorify-data/smoke.sh`.

All paths below are relative to the repo root (`Skorify_Data/`).

## Prerequisites

Node.js and pnpm must be available (already present in this repo). Docker is required only for the `--with-db` mode.

## Setup

Install root deps if node_modules is absent:

```bash
pnpm install
```

Install dev-server deps if absent:

```bash
cd dev-server && pnpm install && cd ..
```

## Build

```bash
pnpm run build
# → compiles lib/ + entities/ → dist/
```

## Run (agent path)

Run the smoke script — it starts the dev-server, polls until ready, hits structural endpoints, then stops:

```bash
bash .claude/skills/run-skorify-data/smoke.sh
```

Expected output ends with `=== smoke OK ===`. Logs at `/tmp/skorify-dev.log`.

To also spin up PostgreSQL via Docker and test entity endpoints:

```bash
bash .claude/skills/run-skorify-data/smoke.sh --with-db
# Runs pnpm run setup (docker compose + migrations) first, then entity checks
```

To keep the server running for ad-hoc curl calls:

```bash
(cd dev-server && node_modules/.bin/tsx server.ts) &> /tmp/skorify-dev.log &
# Wait for ready:
for i in $(seq 1 30); do curl -sf http://localhost:3000/health > /dev/null && break; sleep 0.5; done

curl http://localhost:3000/health          # → {"ok":true}
curl http://localhost:3000/exports         # → list of all exported symbols
curl http://localhost:3000/dbclient-shape  # → DBClient prototype methods

# Entity endpoints — need DB:
curl http://localhost:3000/users
curl http://localhost:3000/tournaments
curl http://localhost:3000/matches

# Stop:
pkill -f "tsx server.ts"
```

Available entity names for `/:entity`: `users`, `tournaments`, `teams`, `matches`, `predictions`, `tournament_instances`, `user_enrollments`.

## Run (human path)

```bash
pnpm run setup          # start DB + migrate
cd dev-server && pnpm run dev   # hot-reload server on :3000; Ctrl-C to stop
```

## Gotchas

- **`tsx` not on PATH** — must use `dev-server/node_modules/.bin/tsx server.ts` from inside `dev-server/`. Running `tsx server.ts` directly from a plain shell will fail with "command not found."
- **dev-server imports compiled `dist/`, not source** — it depends on `skorifydata` as `file:..`, which resolves to `dist/lib/index.js`. Changes to `lib/` need `pnpm run build` to take effect in the dev-server.
- **Entity endpoints require DB** — `/users`, `/tournaments`, etc. attempt a TypeORM connection on each request. Without a running Postgres they return a 500. Use `--with-db` in the smoke script or run `pnpm run setup` first.
