import { BackendClient } from "./helpers/backend-client.js";
import { createEventLogger } from "./helpers/logger.js";
import type { InstanceRankingResult } from "./helpers/types.js";

const BACKEND_URL = process.env.BACKEND_URL ?? "";

const logger = createEventLogger("CalculateInstanceRankingLambda");

interface InstanceItem {
  id: string;
  name: string;
  tournament_id: string;
  state: string;
}

function createMockRanking(instanceId: string): InstanceRankingResult {
  return {
    instance_id: instanceId,
    rank: Math.floor(Math.random() * 10) + 1,
    total_points: Math.floor(Math.random() * 50),
    exact_hits: Math.floor(Math.random() * 5),
    outcome_hits: Math.floor(Math.random() * 10),
  };
}

export const handler = async (event: InstanceItem) => {
  logger.started(event.id, "Calculating instance ranking", {
    name: event.name,
    tournament_id: event.tournament_id,
  });

  let result: InstanceRankingResult;

  if (BACKEND_URL) {
    const client = new BackendClient({ baseUrl: BACKEND_URL });
    result = await client.calculateInstanceRanking(event.id);
    logger.success(event.id, "Instance ranking calculated by backend", result);
  } else {
    result = createMockRanking(event.id);
    logger.success(event.id, "Mock instance ranking calculated", result);
  }

  return result;
};
