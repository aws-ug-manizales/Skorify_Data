import {
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { initBackedClient } from '../../utils/backend-client';
import { createEventLogger } from '../../utils/logger';

import type { FootballDataTeam, ParsedMatch } from '../../utils/types';
import { DDBClient } from '../../utils/ddbClient';

const logger = createEventLogger("ResolveTeamsLambda");

const teamDdb = new DDBClient("TEAM_MAPPING_TABLE");
const backend = initBackedClient(logger);

async function resolveTeam(fdTeam: FootballDataTeam): Promise<string> {
    const fdataId = String(fdTeam.id);
    logger.info(fdataId, "Resolving team", { team: fdTeam });

    const { Item } = await teamDdb.get({ fdataId });

    if (Item?.postgresId) {
        logger.info(fdataId, `Team ${fdataId} found in mapping -> ${Item.postgresId}`, { team: fdTeam });
        return Item.postgresId as string;
    }

    const created = await backend.createTeam({
        name: fdTeam.name,
        code: fdTeam.tla ?? fdTeam.shortName ?? fdTeam.name,
        shieldUrl: fdTeam.crest ?? '',
    });

    await teamDdb.put({ fdataId, postgresId: created.id });

    logger.info(fdataId, `Team ${fdataId} created in postgres -> ${created.id}`, { team: fdTeam });
    return created.id ?? '';
}

export const handler = async (
    match: ParsedMatch,
): Promise<ParsedMatch & { home_team_id: string; away_team_id: string }> => {
    logger.started(String(match.id), 'Resolving teams for match', { match });

    const [home_team_id, away_team_id] = await Promise.all([
        resolveTeam(match.homeTeam),
        resolveTeam(match.awayTeam),
    ]);

    logger.success(String(match.id), 'Teams resolved successfully', { match, home_team_id, away_team_id });
    return { ...match, home_team_id, away_team_id };
};
