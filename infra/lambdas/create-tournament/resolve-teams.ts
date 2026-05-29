import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { BackendClient } from '../../utils/backend-client';

const BACKEND_URL = process.env.BACKEND_URL ?? "";

interface FootballDataTeam {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
}

interface ParsedMatch {
    id: number;
    utcDate: string;
    status: string;
    matchday: number;
    tournament_id: string;
    homeTeam: FootballDataTeam;
    awayTeam: FootballDataTeam;
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

if (!BACKEND_URL) {
    console.log("batch", "BACKEND_URL not configured, cannot calculate ranking", null);
    throw new Error("BACKEND_URL not configured");
}

const backend = new BackendClient({ baseUrl: BACKEND_URL });

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
