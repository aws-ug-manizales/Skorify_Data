interface RankingEvent {
  tournament_id: string;
  match_id: string;
  timestamp: string;
}

interface TournamentInstance {
  id: string;
  name: string;
  tournament_id: string;
  state: string;
}

function createMockInstances(tournamentId: string): TournamentInstance[] {
  return [
    { id: crypto.randomUUID(), name: "Polla Amigos FC", tournament_id: tournamentId, state: "approved" },
    { id: crypto.randomUUID(), name: "Polla Oficina", tournament_id: tournamentId, state: "approved" },
    { id: crypto.randomUUID(), name: "Polla Familia", tournament_id: tournamentId, state: "approved" },
  ];
}

export const handler = async (event: RankingEvent) => {
  console.log("getTournamentInstances received:", JSON.stringify(event, null, 2));

  const instances = createMockInstances(event.tournament_id);

  console.log(`Found ${instances.length} instances for tournament ${event.tournament_id}`);
  return { tournament_id: event.tournament_id, instances };
};
