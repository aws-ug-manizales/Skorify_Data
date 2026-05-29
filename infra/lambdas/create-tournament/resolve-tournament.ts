import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { BackendClient } from '../../utils/backend-client';

const BACKEND_URL = process.env.BACKEND_URL ?? "";

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

if (!BACKEND_URL) {
    console.log("batch", "BACKEND_URL not configured, cannot calculate ranking", null);
    throw new Error("BACKEND_URL not configured");
}

const backend = new BackendClient({ baseUrl: BACKEND_URL });

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
        const created = await backend.createTournament({
            name: competition.name,
            startDate: competition.currentSeason?.startDate ?? "",
            endDate: competition.currentSeason?.endDate ?? "",
            matchType: "SingleMatchPerRound",
        });

        await ddb.send(
            new PutCommand({
                TableName: table,
                Item: { fdataId, postgresId: created.id },
            }),
        );

        console.log(`Tournament ${fdataId} created in postgres -> ${created.id}`);
        tournament_id = created.id!;
    }

    return {
        matches: matches.map(match => ({ ...match, tournament_id })),
    };
};
