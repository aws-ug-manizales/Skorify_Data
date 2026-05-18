import { DBClient } from 'skorifydata';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { buildDbClient } from '../utils/dbClient';

interface FootballDataCompetition {
    id: number;
    name: string;
    code: string;
    currentSeason?: {
        startDate?: string;
        endDate?: string;
    };
}

interface ParsedMatch {
    id: number;
    utcDate: string;
    status: string;
    matchday: number;
    homeTeam: { id: number; name: string; shortName?: string; tla?: string; crest?: string };
    awayTeam: { id: number; name: string; shortName?: string; tla?: string; crest?: string };
}

interface HandlerInput {
    matches: ParsedMatch[];
    competition: FootballDataCompetition;
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

let dbClientPromise: Promise<DBClient> | null = null;

function getDbClient(): Promise<DBClient> {
    if (!dbClientPromise) {
        dbClientPromise = buildDbClient();
    }
    return dbClientPromise;
}

export const handler = async (
    event: HandlerInput,
): Promise<{ matches: (ParsedMatch & { tournament_id: string })[] }> => {
    const { matches, competition } = event;
    const fdataId = String(competition.id);

    const table = process.env.TOURNAMENT_MAPPING_TABLE;
    if (!table) {
        throw new Error('TOURNAMENT_MAPPING_TABLE env var not set');
    }

    const { Item } = await ddb.send(
        new GetCommand({ TableName: table, Key: { fdataId } }),
    );

    let tournament_id: string;

    if (Item?.postgresId) {
        console.log(`Tournament ${fdataId} found in mapping -> ${Item.postgresId}`);
        tournament_id = Item.postgresId as string;
    } else {
        const db = await getDbClient();
        const created = await db.tournaments.create({
            name: competition.name,
            token: competition.code,
            start_date: competition.currentSeason?.startDate ?? null,
            end_date: competition.currentSeason?.endDate ?? null,
        });

        await ddb.send(
            new PutCommand({
                TableName: table,
                Item: { fdataId, postgresId: created.id },
            }),
        );

        console.log(`Tournament ${fdataId} created in postgres -> ${created.id}`);
        tournament_id = created.id;
    }

    return {
        matches: matches.map(match => ({ ...match, tournament_id })),
    };
};
