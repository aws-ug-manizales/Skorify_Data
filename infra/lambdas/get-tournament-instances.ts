import { BackendClient } from "./helpers/backend-client.js";
import { createEventLogger } from "./helpers/logger.js";
import type { TournamentInstance } from "./helpers/types.js";

const BACKEND_URL = process.env.BACKEND_URL ?? "";

const logger = createEventLogger("GetTournamentInstancesLambda");

interface RankingEvent {
  tournament_id: string;
  match_id: string;
  timestamp: string;
}

function createMockInstances(tournamentId: string): TournamentInstance[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Polla Amigos FC",
      tournament_id: tournamentId,
      state: "approved",
    },
    {
      id: crypto.randomUUID(),
      name: "Polla Oficina",
      tournament_id: tournamentId,
      state: "approved",
    },
    {
      id: crypto.randomUUID(),
      name: "Polla Familia",
      tournament_id: tournamentId,
      state: "approved",
    },
  ];
}

export const handler = async (event: RankingEvent) => {
  logger.started(event.match_id, "Retrieving tournament instances", {
    tournament_id: event.tournament_id,
  });

  let instances: TournamentInstance[];

  if (BACKEND_URL) {
    const client = new BackendClient({ baseUrl: BACKEND_URL });
    instances = await client.getTournamentInstances(event.tournament_id);
    logger.success(event.match_id, `Found ${instances.length} instances from backend`);
  } else {
    instances = createMockInstances(event.tournament_id);
    logger.success(event.match_id, `Using ${instances.length} mock instances`);
  }

  return { tournament_id: event.tournament_id, instances };
};
