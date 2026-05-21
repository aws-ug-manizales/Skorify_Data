interface GlobalRankingInput {
  tournament_id: string;
  instances: Array<{
    instance_id: string;
    rank: number;
    total_points: number;
  }>;
}

interface GlobalRankingOutput {
  tournament_id: string;
  leaderboard: Array<{
    instance_id: string;
    position: number;
    total_points: number;
  }>;
  calculated_at: string;
}

export const handler = async (event: GlobalRankingInput) => {
  console.log("calculateGlobalRanking received:", JSON.stringify(event, null, 2));

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

  console.log("Global ranking result:", JSON.stringify(output, null, 2));
  return output;
};
