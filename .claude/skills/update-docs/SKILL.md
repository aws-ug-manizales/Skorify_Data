---
name: update-docs
description: Regenerate and keep all repository documentation up to date. Use when asked to update docs, refresh documentation, sync docs with code changes, or update the README. Writes to docs/DATABASE.md, docs/ENTITIES.md, docs/ETL.md, and Readme.md.
---

This skill keeps four documentation files in sync with the source code. Each file has a clear owner: read specific source files, then rewrite the target doc. Run from repo root (`Skorify_Data/`).

**Output files:**

| Doc | Source of truth |
|---|---|
| `docs/DATABASE.md` | `knexfile.js`, `docker-compose.yml`, `migrations/*.js`, `package.json` scripts |
| `docs/ENTITIES.md` | `entities/*.ts`, `lib/services/*.ts`, `lib/services/README.md` |
| `docs/ETL.md` | `infra/lambdas/etl-process/*.ts`, `infra/lambdas/create-tournament/*.ts`, `infra/lib/match-processing-stack.ts`, `infra/lib/constructs/createMatchesFlow.ts`, `infra/utils/backend-client.ts`, `infra/utils/types.ts` |
| `Readme.md` | All three docs above + `package.json` |

---

## Step 1 — Update `docs/DATABASE.md`

**Read these files first:**
- `knexfile.js`
- `docker-compose.yml`
- `package.json` (scripts section)
- All files in `migrations/` (filename + first 5 lines of each to extract intent)

**Write `docs/DATABASE.md` with this structure:**

```
# Database

## Local setup
(docker-compose postgres defaults: host, port, DB name, user, password)
(how to start: pnpm run db:up)

## Running migrations
(the working command: npx knex --knexfile knexfile.js migrate:latest with env vars)
(note: pnpm run migrate does NOT work — Docker container lacks pnpm)

## Migration history
Table: | File | Description | Notes |
(one row per file in migrations/, filename → derive description from filename snake_case words)

## Available scripts
(from package.json: db:up, db:down, migrate, status, rollback, setup, seed — one line each)

## Reset everything
docker compose down -v && pnpm run setup
```

---

## Step 2 — Update `docs/ENTITIES.md`

**Read these files first:**
- Every file in `entities/` (all `@Column`, `@Entity`, `@PrimaryGeneratedColumn` decorators)
- Every file in `lib/services/` (class name and any overrides of `validateRules`)
- `lib/services/README.md` (base service methods)

**Write `docs/ENTITIES.md` with this structure:**

```
# Entity Library

## DBClient
(how to instantiate: new DBClient(DataSourceOptions))
(available service properties: users, tournaments, teams, matches, predictions,
 tournamentInstances, userEnrollments)
(methods: connect(), disconnect(), getServiceByName(name))

## Base service methods
(table from lib/services/README.md: method, signature, description)

## Entities

For each entity in entities/:
### <EntityName>  — table: `<@Entity value>`
| Column | Type | Constraints |
|--------|------|-------------|
(one row per @Column / @PrimaryGeneratedColumn)
Constraints cell: PK / FK→table / NOT NULL / UNIQUE / DEFAULT value / nullable — derived from decorator options

Service: `dbClient.<serviceProp>` — file: `lib/services/<Name>.service.ts`
Custom rules: (list any validateRules overrides, or "none")
```

Column type mapping for the table (TypeORM → human-readable):
- `uuid` → UUID
- `varchar` → string
- `int` / `integer` → integer
- `boolean` → boolean
- `date` → date
- `timestamptz` → timestamp with timezone
- `enum` → enum(values…)

---

## Step 3 — Update `docs/ETL.md`

**Read these files first:**
- `infra/lib/match-processing-stack.ts`
- `infra/lib/constructs/createMatchesFlow.ts`
- `infra/lambdas/etl-process/worker.ts`
- `infra/lambdas/etl-process/finish-match.ts`
- `infra/lambdas/etl-process/notify-users.ts`
- `infra/lambdas/etl-process/calculate-ranking.ts`
- `infra/lambdas/create-tournament/get-matches-by-competition.ts`
- `infra/lambdas/create-tournament/resolve-tournament.ts`
- `infra/lambdas/create-tournament/resolve-teams.ts`
- `infra/lambdas/create-tournament/save-matches.ts`
- `infra/utils/backend-client.ts`
- `infra/utils/types.ts`
- `infra/lib/constants.ts` (event sources and detail types)

**Write `docs/ETL.md` with this structure:**

```
# ETL Flow

## Overview
Two sub-flows in the MatchProcessingStack (SkorifyEventBridge stack).

## Sub-flow 1 — CreateMatchesFlow (one-time setup)
Mermaid flowchart:

​```mermaid
flowchart TD
  A[Manual trigger\nStep Functions] --> B[GetMatchesByCompetition\nlambda]
  B -->|matches + competition| C[ResolveTournament\nlambda]
  C -->|matches + tournament_id| D{for each match\nMap concurrency=5}
  D --> E{DDB CheckMatchMapping}
  E -->|exists| F[Skip]
  E -->|missing| G[ResolveTeams\nlambda]
  G --> H[SaveMatches\nlambda]
  H -->|writes| I[(Postgres)]
  H -->|writes| J[(DynamoDB\nMapping Tables)]
​```

Description: what each lambda does, its env vars, and the DDB tables it reads/writes.

## Sub-flow 2 — MatchProcessingFlow (every 5 min)
Mermaid flowchart:

​```mermaid
flowchart TD
  S[EventBridge Schedule\nevery 5 min] --> W[Worker Lambda]
  W -->|GET /competitions/id/matches| FD[football-data.org API]
  W -->|BatchGet fdataId→postgresId| DDB[(DynamoDB)]
  W -->|PutEvents MatchFinished| EB{SkorifyDataBus}

  EB -->|source=SkorifyData\nMatchFinished| Q1[SQS FinishMatchQueue]
  EB -->|source=SkorifyBackend\nNotifyUserDomainEvent| Q2[SQS NotifyUserQueue]
  EB -->|source=SkorifyBackend\nClosedMatchDomainEvent| Q3[SQS CalculateRankingQueue]

  Q1 --> FM[FinishMatch Lambda]
  Q2 --> NU[NotifyUsers Lambda]
  Q3 --> CR[CalculateRanking Lambda]

  FM -->|POST /matches/id/process| BE[Skorify Backend]
  NU -->|POST /notifications| BE
  CR -->|POST /tournament-instance/id/calculate-tournament-instance-ranking| BE
​```

Description: polling frequency (read from match-processing-stack.ts Schedule.rate), 
retry config (from retry.ts defaults), DLQ retention.

## Event contracts
Table: | Event | Bus | Source | DetailType | Publisher | Payload fields |

## Backend API contracts
Table: | Lambda | Method | Path | Payload type | Expected response |
(derive from backend-client.ts methods)

## football-data.org API
- Base URL, auth header, env var name
- Endpoint used (derive from footballDataClient.ts)
- Fields consumed (derive from parseMatch)
- Stage and status value mappings (derive from save-matches.ts getStage/mapStatus)

## Env vars per lambda
Table: | Lambda | Env var | Source |
(derive from addEnvironment calls in match-processing-stack.ts and createMatchesFlow.ts)
```

---

## Step 4 — Update `Readme.md`

**Read the current `Readme.md` and the three updated docs above.**

**Rewrite `Readme.md` keeping:**
- The Mermaid ER diagram code block (update it if entity fields changed)
- The entities table (update with current entities and their service status)
- The scripts table (update from package.json)

**Keep `Readme.md` high-level.** It should link to the three docs for details:
- `→ See [docs/DATABASE.md](docs/DATABASE.md) for migration commands and history`
- `→ See [docs/ENTITIES.md](docs/ENTITIES.md) for entity fields and service API`
- `→ See [docs/ETL.md](docs/ETL.md) for ETL flow diagrams and backend contracts`

**ER diagram update rule:** For each `@Entity` class in `entities/`, verify that every `@Column` appears in the Mermaid diagram. Add missing fields, remove deleted ones. The diagram uses the DB column name (snake_case), not the TypeScript property name.

---

## What NOT to change

- `docs/SkorifyDB.png` — image file, do not touch
- `lib/services/README.md` — service author docs, do not overwrite
- Any file outside `docs/`, `Readme.md`

---

## Verification

After writing all four files, run:

```bash
# Confirm no broken markdown links in Readme
grep -oP '\[.*?\]\(\K[^)]+' Readme.md | while read f; do [ -e "$f" ] && echo "OK $f" || echo "MISSING $f"; done
```

If any link points to a missing file, fix it before finishing.
