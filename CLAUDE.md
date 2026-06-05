# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Skorify_Data** is a data layer library and AWS serverless infrastructure for a sports prediction/betting platform. It consists of two main concerns:

1. **A TypeScript library** (`/lib`, `/entities`) consumed by the backend API for database access
2. **AWS CDK infrastructure** (`/infra`) with Lambda workers that ingest match data from football-data.org and drive the prediction scoring pipeline

## Commands

### Local Development

```bash
# Start local PostgreSQL
pnpm run db:up

# Run all pending migrations
pnpm run migrate

# Full setup from scratch
pnpm run setup          # db:up + migrate

# Seed initial data
pnpm run seed

# Stop and remove containers
pnpm run db:down
```

### Build

```bash
pnpm run build          # TypeScript compile → /dist
```

### Migration Management

```bash
pnpm run status         # Show pending/completed migrations
pnpm run rollback       # Revert last migration batch
```

### Infrastructure (from `/infra`)

```bash
cd infra
npx cdk synth --all                  # Synthesize all stacks
npx cdk synth skorifyDatabase        # DB stack only
npx cdk deploy <StackName>           # Deploy specific stack
```

### Dev Server (from `/dev-server`)

```bash
cd dev-server
pnpm run dev            # Express server on port 3000 (TSX hot reload)
```

## Architecture

### Data Library Pattern

The library exposes a `DBClient` class that wraps all entity services. Consumers instantiate it with TypeORM `DataSourceOptions`:

```
DBClient
  ├── UserService
  ├── TournamentService
  ├── TeamService
  ├── MatchService
  ├── TournamentInstanceService
  ├── UserEnrollmentService
  └── PredictionService
```

Each service extends `BaseDataService<InternalEntity, DomainEntity>` which provides generic CRUD, filtering, sorting, and soft-delete. The domain entities come from the `@skorify/domain` package (private GitHub dependency).

Mappers (`/lib/mappers`) handle bidirectional conversion between TypeORM entities and domain objects using `class-transformer`.

### AWS Infrastructure (Two Stacks)

**DatabaseStack** — RDS PostgreSQL 18 (t4g.micro) in a private VPC. Credentials auto-generated in Secrets Manager, ARN exported via SSM at `/skorify/{env}/db-secret-arn`. Dev has auto start/stop via EventBridge scheduler for cost savings.

**MatchProcessingStack** — Event-driven ETL pipeline:

```
Scheduled Worker (5 min)
  └── football-data.org API
        └── EventBridge (SkorifyDataBus)
              ├── SQS → FinishMatch Lambda → backend HTTP callback
              ├── SQS → NotifyUsers Lambda
              └── SQS → CalculateRanking Lambda
```

DynamoDB tables map `football-data.org` external IDs to internal Postgres IDs and track processing status to prevent duplicate ingestion.

### Key Design Rules

- **External ID bridging:** DynamoDB is the cache layer between football-data.org IDs and Postgres UUIDs. Never bypass it when processing matches.
- **Batch events:** EventBridge has a 10-event batch limit; the worker splits events accordingly.
- **Migrations are Knex, not TypeORM:** Schema changes go in `/migrations` as Knex files. TypeORM is query-only.
- **Library exports via `/dist`:** Always build before testing library consumption. The dev-server imports from the compiled output.
- **Environment targeting:** CDK stacks accept `envName` context for dev/staging/prod differentiation.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| ORM | TypeORM 0.3.x |
| Migrations | Knex 3.x |
| Database | PostgreSQL 18 (RDS / Docker local) |
| Cloud Infra | AWS CDK (TypeScript) |
| Serverless | Lambda (Node.js 22), EventBridge, SQS, DynamoDB |
| Package Manager | pnpm (workspaces) |
| Local Dev | Docker Compose + Express dev-server |
