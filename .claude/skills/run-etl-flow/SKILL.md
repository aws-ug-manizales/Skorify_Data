---
name: run-etl-flow
description: Understand, code, and modify the Skorify ETL pipeline inside the MatchProcessingStack (SkorifyEventBridge). Use when asked to add a feature, fix a bug, or understand how match ingestion, finish-match processing, notifications, or ranking calculation work. Covers football-data.org dependencies and backend API contracts.
---

All paths are relative to `infra/`. The ETL pipeline lives entirely inside `infra/` — lambdas, utils, and CDK stack definition.

## How the flow works

There are two independent sub-flows wired together by the same `MatchProcessingStack`.

### Sub-flow 1 — CreateMatchesFlow (one-time setup)

Triggered manually by invoking the Step Functions state machine. Ingests a competition's full match schedule from football-data.org into Postgres and populates the DynamoDB mapping tables.

```
Step Functions (CreateMatchesStateMachine)
  └─ GetMatchesByCompetition (Lambda)       ← calls football-data.org /v4/competitions/{id}/matches
       └─ ResolveTournament (Lambda)         ← upserts Tournament in Postgres; writes fdataId→postgresId to DDB
            └─ for each match (Map, concurrency=5):
                 CheckMatchMapping (DDB GetItem)
                   ├─ exists  → SkipExistingMatch
                   └─ missing → ResolveTeams (Lambda)  ← upserts Teams in Postgres; writes DDB
                                  └─ SaveMatches (Lambda)   ← saves Match in Postgres; writes DDB
```

**Key files:**
| File | Role |
|---|---|
| `lambdas/create-tournament/get-matches-by-competition.ts` | Calls `footballDataClient`, returns `{ matches, competition }` |
| `lambdas/create-tournament/resolve-tournament.ts` | DDB lookup → Postgres upsert via `db.tournaments.save()` |
| `lambdas/create-tournament/resolve-teams.ts` | DDB lookup → Postgres upsert via `db.teams.save()` per match |
| `lambdas/create-tournament/save-matches.ts` | Postgres upsert via `db.matches.save()`; writes final DDB match mapping |
| `lib/constructs/createMatchesFlow.ts` | CDK wiring: Step Functions definition + Lambda env vars |

---

### Sub-flow 2 — MatchProcessingFlow (recurring, every 5 min)

Runs on a schedule. Detects finished matches, publishes events, and fans out to three independent consumer lambdas.

```
EventBridge Schedule (every 5 min)
  └─ Worker Lambda
       ├─ GETs finished matches from football-data.org
       ├─ Looks up DDB for each match/tournament → resolves Postgres IDs
       └─ PutEvents → SkorifyDataBus (DetailType: MatchFinished)

SkorifyDataBus
  ├─ source=SkorifyData, DetailType=MatchFinished
  │    └─ SQS FinishMatchQueue → FinishMatch Lambda
  │         └─ POST /matches/{match_id}/process → Backend
  │
  ├─ source=SkorifyBackend, DetailType=NotifyUserDomainEvent
  │    └─ SQS NotifyUserQueue → NotifyUsers Lambda
  │         └─ POST /notifications → Backend
  │
  └─ source=SkorifyBackend, DetailType=ClosedMatchDomainEvent
       └─ SQS CalculateRankingQueue → CalculateRanking Lambda
            └─ POST /tournament-instance/{instance_id}/calculate-tournament-instance-ranking → Backend
```

**Key files:**
| File | Role |
|---|---|
| `lambdas/etl-process/worker.ts` | Polls football-data.org; resolves DDB IDs; publishes `MatchFinished` events |
| `lambdas/etl-process/finish-match.ts` | SQS consumer; calls `backend.processMatch()` |
| `lambdas/etl-process/notify-users.ts` | SQS consumer; calls `backend.notifyUsers()` |
| `lambdas/etl-process/calculate-ranking.ts` | SQS consumer; calls `backend.calculateTournamentInstanceRanking()` |
| `lib/match-processing-stack.ts` | CDK wiring: EventBridge rules, SQS queues, Lambda env vars, DLQ, CloudWatch dashboard |

---

## Where to change code for each type of feature

### Change which competition the worker polls

`lambdas/etl-process/worker.ts` line 23:
```ts
const { matches } = await getMatchesByCompetition("WC");
```
Replace `"WC"` with the football-data.org competition code (e.g. `"PL"` for Premier League). The ID must already be ingested via CreateMatchesFlow so the DDB mapping tables are populated.

### Change which match stages are fetched

`utils/footballDataClient.ts` line 9:
```ts
const matchesResponse = await getRequest(`${BASE_URL}/competitions/${competitionId}/matches?stage=GROUP_STAGE`);
```
Change `?stage=GROUP_STAGE` or remove the filter to get all stages. Requires a football-data.org API key with the right plan.

### Add a new field to the `MatchFinished` event

1. Add the field to `MatchFinishedDetail` in `utils/types.ts`
2. Include the field in `mapMatchToEventDetail()` in `worker.ts`
3. Read the field in `finish-match.ts` (it arrives via `detail`)
4. Tell the backend team — they receive this payload at `POST /matches/{id}/process`

### Change polling frequency

`lib/match-processing-stack.ts` line 142:
```ts
new events.Rule(this, 'WorkerScheduleRule', {
  schedule: events.Schedule.rate(Duration.minutes(5)),
```
Change `5` to the desired interval, then redeploy the stack.

### Add a new consumer for a new event type

1. Create `lambdas/etl-process/my-new-lambda.ts` with the same SQS handler pattern as `finish-match.ts`
2. Add a new SQS queue in `match-processing-stack.ts` using `createQueue()`
3. Wire `createLambda()` + `addEnvironment(ENV.BACKEND_URL, backendUrl)` + `addEventSource(SqsEventSource)`
4. Add an EventBridge rule matching `source` and `detailType` → the new queue
5. Add the new lambda to the `lambdas` array for the CloudWatch dashboard

### Change retry behavior for backend calls

`utils/retry.ts` — `DEFAULT_MAX_ATTEMPTS = 3`, `DEFAULT_BASE_DELAY_MS = 1000` (exponential backoff). Override per-call via `BackendClient` constructor `retryOptions`.

### Add a new backend endpoint call

Add a method to `utils/backend-client.ts`. Follow the existing pattern (`this.request('POST', '/path', body)`). Retry is automatic via `withRetry`.

---

## football-data.org dependencies

| What | Details |
|---|---|
| **API base URL** | `https://api.football-data.org/v4` |
| **Auth** | `X-Auth-Token` header — env var `FOOTBALL_DATA_API_TOKEN` on Worker Lambda and GetMatchesByCompetition Lambda |
| **Endpoint used** | `GET /competitions/{competitionId}/matches?stage=GROUP_STAGE` |
| **Fields consumed** | `match.id`, `match.status` (`FINISHED`/`FT`), `match.score.fullTime.home/away`, `match.competition.id`, `match.utcDate`, `match.stage`, `match.homeTeam`, `match.awayTeam` |
| **Status values** | Worker filters on `FINISHED` or `FT`; save-matches maps `SCHEDULED`, `TIMED`, `IN_PLAY`, `PAUSED`, `FINISHED`, `POSTPONED`, `SUSPENDED`, `CANCELED` → internal enum |
| **Stage values** | save-matches maps `GROUP_STAGE`→`group`; `LAST_16/32`, `QUARTER_FINALS`, `SEMI_FINALS`, `THIRD_PLACE`, `FINAL` → `finals`. Unknown stages throw — fix in `save-matches.ts:getStage()` |
| **DDB prerequisite** | The Worker requires `fdataId→postgresId` entries in `MatchMappingTable` and `TournamentMappingTable`. These are only written by CreateMatchesFlow. Running the Worker before running CreateMatchesFlow produces empty mapping lookups and no events. |

---

## Backend team dependencies

The three consumer lambdas call the Skorify backend. These are the contracts:

| Lambda | HTTP call | Payload | Expected response |
|---|---|---|---|
| **FinishMatch** | `POST /matches/{match_id}/process` | `MatchFinishedDetail` — `{ match_id, tournament_id, final_home_goals, final_away_goals, stage, timestamp }` | `204` or any 2xx |
| **NotifyUsers** | `POST /notifications` | raw `detail` object from `NotifyUserDomainEvent` (shape defined by backend) | `204` or any 2xx |
| **CalculateRanking** | `POST /tournament-instance/{instance_id}/calculate-tournament-instance-ranking` | `CalculateInstanceRankingDetail` — `{ match_id, tournament_id, instance_id }` | `204` or any 2xx |

**Event sources the backend must publish** for NotifyUsers and CalculateRanking to trigger:

| Event | Bus | Source | DetailType | Who publishes |
|---|---|---|---|---|
| Notify users | `SkorifyDataBus` | `SkorifyBackend` | `NotifyUserDomainEvent` | Backend (after processing a match) |
| Calculate ranking | `SkorifyDataBus` | `SkorifyBackend` | `ClosedMatchDomainEvent` | Backend (after closing a match) |

The bus name is stored in SSM at `/skorify/{env}/data-bus-name`. The backend must have IAM permission `events:PutEvents` on this bus.

---

## Observability

CloudWatch dashboard `SkorifyMatchProcessing` shows Lambda invocations, errors, duration, SQS message counts, and DLQ depth. A CloudWatch alarm fires when any message lands in the DLQ (`DLQAlarm`).

To inspect failed messages:
```bash
# List DLQ messages (replace queue URL with actual value from console)
aws sqs receive-message \
  --queue-url <DLQ_URL> \
  --max-number-of-messages 10 \
  --attribute-names All \
  --query 'Messages[*].{id:MessageId,body:Body}'
```

---

## Deploying changes

All lambdas are bundled by esbuild at `cdk deploy` time — no separate build step needed for lambda code. From `infra/`:

```bash
npx cdk deploy skorify-event-bridge-dev \
  --context env=dev \
  --context vpcName=<vpc-name> \
  --context backendUrl=<backend-url>
```

Set `FOOTBALL_DATA_API_TOKEN` in the environment before deploying — it is read from `process.env` at synth time and injected as a Lambda env var.
