import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { BackendClient } from "../../utils/backend-client.js";
import { createEventLogger } from "../../utils/logger.js";
import type { MatchFinishedDetail } from "../../utils/types.js";

const eventBridge = new EventBridgeClient();
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME ?? "SkorifyDataBus";
const BACKEND_URL = process.env.BACKEND_URL ?? "";

const logger = createEventLogger("WorkerLambda");

function generateMockMatches(): MatchFinishedDetail[] {
  return [
    {
      match_id: crypto.randomUUID(),
      tournament_id: crypto.randomUUID(),
      final_home_goals: Math.floor(Math.random() * 5),
      final_away_goals: Math.floor(Math.random() * 4),
      stage: Math.random() > 0.5 ? "group" : "finals",
      timestamp: new Date().toISOString(),
    },
  ];
}

async function publishMatchFinished(detail: MatchFinishedDetail): Promise<void> {
  const command = new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: "SkorifyData",
        DetailType: "MatchFinished",
        Detail: JSON.stringify(detail),
      },
    ],
  });
}

export const handler = async (): Promise<void> => {
  logger.started("batch", "Worker checking for finished matches");

  let matches: MatchFinishedDetail[];

  if (BACKEND_URL) {
    const client = new BackendClient({ baseUrl: BACKEND_URL });
    const backendMatches = await client.getFinishedMatches();

    matches = backendMatches.map((m) => ({
      match_id: m.id,
      tournament_id: m.tournament_id,
      final_home_goals: m.home_goals,
      final_away_goals: m.away_goals,
      stage: m.stage,
      timestamp: new Date().toISOString(),
    }));

    logger.success("batch", `Found ${matches.length} finished matches from backend`);
  } else {
    matches = generateMockMatches();
    logger.success(
      "batch",
      `BACKEND_URL not set, using ${matches.length} mock match(es)`
    );
  }

  for (const detail of matches) {
    await publishMatchFinished(detail);
    logger.success(
      detail.match_id,
      "Published MatchFinished to SkorifyData",
      {
        tournament_id: detail.tournament_id,
        stage: detail.stage,
      }
    );
  }
};
