import { DDBClient } from '../../utils/ddbClient';
import { initBackedClient } from '../../utils/backend-client';

import type { HandlerInput, ParsedMatch } from '../../utils/types';
import { createEventLogger } from '../../utils/logger';

const logger = createEventLogger("ResolveTournamentLambda");
const ddb = new DDBClient("TOURNAMENT_MAPPING_TABLE");
const backend = initBackedClient(logger);

export const handler = async (
    event: HandlerInput,
): Promise<{ matches: (ParsedMatch & { tournament_id: string })[] }> => {
    const { matches, competition } = event;
    const fdataId = String(competition.id);
    logger.started(fdataId, 'Resolving tournament for competition', { competition, matches });

    const { Item } = await ddb.get({ fdataId });

    let tournament_id: string;

    if (Item?.postgresId) {
        logger.info(fdataId, `Tournament ${fdataId} found in mapping -> ${Item.postgresId}`, { competition });
        tournament_id = Item.postgresId as string;
    } else {
        const created = await backend.createTournament({
            name: competition.name,
            startDate: competition.currentSeason?.startDate ?? "",
            endDate: competition.currentSeason?.endDate ?? "",
            matchType: "SingleMatchPerRound",
        });

        await ddb.put({ fdataId, postgresId: created.id });

        logger.info(fdataId, `Tournament ${fdataId} created in postgres -> ${created.id}`, { competition });
        tournament_id = created.id!;
    }

    logger.success(fdataId, 'Tournament resolved successfully', { competition, tournament_id });
    return {
        matches: matches.map(match => ({ ...match, tournament_id })),
    };
};
