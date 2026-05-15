import { createEventLogger } from "./helpers/logger.js";
import type { GlobalRankingOutput } from "./helpers/types.js";

const logger = createEventLogger("CalculateGlobalRankingLambda");

interface GlobalRankingInput {
  tournament_id: string;
  instances: Array<{
    instance_id: string;
    rank: number;
    total_points: number;
    exact_hits: number;
    outcome_hits: number;
  }>;
}

export const handler = async (event: GlobalRankingInput) => {
  logger.started("batch", "Calculating global ranking", {
    tournament_id: event.tournament_id,
    instance_count: (event.instances ?? []).length,
  });

  const leaderboard = (event.instances ?? [])
    .sort((a, b) => b.total_points - a.total_points)
    .map((inst, index) => ({
      instance_id: inst.instance_id,
      position: index + 1,
      total_points: inst.total_points,
    }));

  const output: GlobalRankingOutput = {
    tournament_id: event.tournament_id,
    leaderboard,
    calculated_at: new Date().toISOString(),
  };

  logger.success("batch", "Global ranking calculated", {
    leader_count: leaderboard.length,
  });

  return output;
};
