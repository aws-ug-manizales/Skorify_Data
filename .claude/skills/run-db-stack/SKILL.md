---
name: run-db-stack
description: Set up, migrate, and inspect the Skorify database stack — local Postgres via Docker, Knex migrations, and the AWS RDS scheduler schedule. Use when asked to start the database, run migrations, check migration status, rollback, or understand when the RDS starts and stops.
---

The database stack has two modes: **local** (Postgres in Docker + Knex from host) and **AWS** (RDS PostgreSQL 18 managed by CDK). Drive the local stack with `infra/.claude/skills/run-db-stack/smoke.sh`. All paths are relative to the repo root (`Skorify_Data/`).

## Prerequisites

Docker and pnpm must be available. Run from the repo root — `knexfile.js` is there and must be in `$PWD` for Knex to pick it up.

## Run (agent path)

The smoke script starts Postgres, runs pending migrations, prints status, and tears down:

```bash
bash infra/.claude/skills/run-db-stack/smoke.sh
```

To leave Postgres running for manual inspection:

```bash
bash infra/.claude/skills/run-db-stack/smoke.sh --keep
```

## Individual migration commands

Run all from repo root with these env vars (matching docker-compose defaults):

```bash
export DB_HOST=localhost DB_PORT=5432 DB_NAME=polla_mundial DB_USER=postgres DB_PASSWORD=password
```

```bash
pnpm run db:up                                             # start Postgres (waits for healthy)
npx knex --knexfile knexfile.js migrate:status             # pending vs completed
npx knex --knexfile knexfile.js migrate:latest             # apply pending migrations
npx knex --knexfile knexfile.js migrate:rollback           # revert last batch
pnpm run db:down                                           # stop and remove containers
```

Migration files live in `migrations/` — filename prefix is the timestamp, e.g. `20260517000000_initial_setup.js`. Knex tracks applied migrations in the `knex_migrations` table.

## AWS stack: what gets deployed

`DatabaseStack` (`infra/lib/db-stack.ts`) creates:

| Resource | Detail |
|---|---|
| RDS PostgreSQL 18 | `t4g.micro`, private subnet, `removalPolicy: SNAPSHOT` |
| Bastion host ASG | `t3.micro`, public subnet, SSH key `skorify-{env}-bastion`, `min=0 max=1` |
| Secrets Manager | Auto-generated admin credentials |
| SSM Parameter | `/skorify/{env}/db-secret-arn` → the secret ARN |
| RDS Scheduler | EventBridge → Lambda (dev/staging only, not prod) |
| Migration Lambda | `run-migrations.ts` — runs `knex migrate:latest` in VPC |

## RDS scheduler — hours and logic

The scheduler Lambda (`infra/lambdas/rds-sidecars/rds-scheduler.ts`) is triggered by two EventBridge rules, **UTC times**, **Mon–Fri only**, and **only on non-prod** environments:

| Action | Cron (UTC) | Local Colombia time (UTC-5) |
|---|---|---|
| **Start** | 12:00 Mon–Fri | 07:00 Mon–Fri |
| **Stop** | 01:00 Mon–Fri | 20:00 Sun–Thu |

The Lambda is idempotent — it describes the current RDS status first and skips the action if the instance is already in the target state (returns `{ noop: true }`).

**To change the schedule**, edit `infra/lib/db-stack.ts` lines 92–95:

```ts
new RdsScheduler(this, 'RdsScheduler', {
  databaseInstance: this.database,
  startSchedule: events.Schedule.cron({ minute: '0', hour: '12', weekDay: 'MON-FRI' }),
  stopSchedule:  events.Schedule.cron({ minute: '0', hour: '1',  weekDay: 'MON-FRI' }),
});
```

Then redeploy: `npx cdk deploy skorify-database-dev --context env=dev --context vpcName=<vpc-name>`.

## AWS migrations

The `DbMigrations` construct (`infra/lib/constructs/db-migrations.ts`) deploys a Lambda that runs `knex migrate:latest` inside the VPC using credentials fetched from Secrets Manager. It is **not automatically triggered on deploy** (the CDK Trigger is commented out). To run migrations on AWS, invoke the Lambda manually from the console or CLI after deploy.

The Lambda is force-redeployed whenever `migrations/` content changes (via a SHA-256 hash injected as `MIGRATIONS_HASH` env var).

## Check RDS status via AWS CLI

Replace `<env>` with `dev`, `staging`, or `prod`.

```bash
# Find the instance identifier (look for "skorify" in the name)
aws rds describe-db-instances \
  --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus]' \
  --output table

# Check a specific instance
aws rds describe-db-instances \
  --db-instance-identifier <identifier> \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}' \
  --output table
```

Possible values for `DBInstanceStatus`: `available` (accepting connections), `stopped`, `starting`, `stopping`, `backing-up`, `modifying`.

**Is it in labor hours?** The scheduler runs Mon–Fri. The DB should be `available` between 07:00–20:00 Colombia time (UTC-5). Outside that window on dev/staging, it will be `stopped` — that is expected.

To manually start or stop the instance without waiting for the scheduler:

```bash
# Start (takes ~2–3 min to become available)
aws rds start-db-instance --db-instance-identifier <identifier>

# Stop
aws rds stop-db-instance --db-instance-identifier <identifier>

# Poll until available
watch -n 10 "aws rds describe-db-instances \
  --db-instance-identifier <identifier> \
  --query 'DBInstances[0].DBInstanceStatus' --output text"
```

## Gotchas

- **`pnpm run migrate` fails in Docker** — the `knex` docker-compose service uses `node:24-alpine` with `npm`, but `@skorify/domain` requires `pnpm` in its `prepare` script. Use `npx knex --knexfile knexfile.js` directly from the host (where pnpm and all deps are already installed).
- **Env vars required for Knex** — `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` must be set when running Knex from the host. Defaults are in the docker-compose file but not in the shell environment automatically.
- **CDK synth requires AWS credentials** — `ec2.Vpc.fromLookup` resolves the VPC at synth time from the AWS account. `cdk synth` will fail locally without `AWS_PROFILE` or equivalent credentials set.
- **Scheduler is prod-excluded** — `if (envName !== 'prod')` in `db-stack.ts`. Prod RDS runs 24/7; the scheduler construct is never created for it.
- **Migration Lambda needs VPC access** — it runs inside a private subnet. Invoking it from outside the VPC directly is not possible; use the AWS Lambda console or `aws lambda invoke` with appropriate IAM permissions.
