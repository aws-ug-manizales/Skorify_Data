import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { initBackedClient } from '../../utils/backend-client';
import { createEventLogger } from '../../utils/logger';

import type { FootballDataTeam, ParsedMatch } from '../../utils/types';

const logger = createEventLogger("ResolveTeamsLambda");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const backend = initBackedClient(logger);

async function resolveTeam(fdTeam: FootballDataTeam): Promise<string> {
    const fdataId = String(fdTeam.id);
    const table = process.env.TEAM_MAPPING_TABLE;
    if (!table) {
        throw new Error('TEAM_MAPPING_TABLE env var not set');
    }

    const { Item } = await ddb.send(
        new GetCommand({ TableName: table, Key: { fdataId } }),
    );

    if (Item?.postgresId) {
        console.log(`Team ${fdataId} found in mapping -> ${Item.postgresId}`);
        return Item.postgresId as string;
    }

    const created = await backend.createTeam({
        name: fdTeam.name,
        code: fdTeam.tla ?? fdTeam.shortName ?? fdTeam.name,
        shieldUrl: fdTeam.crest ?? '',
    });

    await ddb.send(
        new PutCommand({
            TableName: table,
            Item: { fdataId, postgresId: created.id },
        }),
    );

    console.log(`Team ${fdataId} created in postgres -> ${created.id}`);
    return created.id ?? '';
}

export const handler = async (
    match: ParsedMatch,
): Promise<ParsedMatch & { home_team_id: string; away_team_id: string }> => {
    console.log('Resolving teams for match:', match.id);

    const [home_team_id, away_team_id] = await Promise.all([
        resolveTeam(match.homeTeam),
        resolveTeam(match.awayTeam),
    ]);

    return { ...match, home_team_id, away_team_id };
};
