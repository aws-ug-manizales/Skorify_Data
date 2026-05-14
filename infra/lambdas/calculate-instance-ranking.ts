interface InstanceItem {
  id: string;
  name: string;
  tournament_id: string;
  state: string;
}

interface CalcResult {
  instance_id: string;
  rank: number;
  total_points: number;
  exact_hits: number;
  outcome_hits: number;
}

export const handler = async (event: InstanceItem) => {
  console.log("calculateInstanceRanking received:", JSON.stringify(event, null, 2));

  const result: CalcResult = {
    instance_id: event.id,
    rank: Math.floor(Math.random() * 10) + 1,
    total_points: Math.floor(Math.random() * 50),
    exact_hits: Math.floor(Math.random() * 5),
    outcome_hits: Math.floor(Math.random() * 10),
  };

  console.log(`Ranking calculated for instance ${event.name}:`, JSON.stringify(result, null, 2));
  return result;
};
