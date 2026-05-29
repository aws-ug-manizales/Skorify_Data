import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { BackendClient } from '../../utils/backend-client';
import type { BackendMatch } from '../../utils/types';

const BACKEND_URL = process.env.BACKEND_URL ?? "";

if (!BACKEND_URL) {
    console.log("batch", "BACKEND_URL not configured, cannot calculate ranking", null);
    throw new Error("BACKEND_URL not configured");
}

const backend = new BackendClient({ baseUrl: BACKEND_URL });

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));


export const handler = async (event: any): Promise<void> => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Saving matches data:', JSON.stringify(event, null, 2));

    console.log('DB client initialized, saving match data...');
    try {
        console.log('DB client connected successfully.');
        const matchData = parseEvent(event);
        const matchMapped = mapMatchData(matchData);
        const saved = await backend.createMatch(matchMapped);
        console.log('Match data saved successfully, postgresId:', saved.id);

        const table = process.env.MATCH_MAPPING_TABLE;
        if (table && matchData.id !== undefined && matchData.id !== null) {
            await ddb.send(
                new PutCommand({
                    TableName: table,
                    Item: {
                        fdataId: String(matchData.id),
                        postgresId: saved.id,
                    },
                }),
            );
            console.log(
                `Mapping written: fdataId=${matchData.id} -> postgresId=${saved.id}`,
            );
        }
    } catch (error) {
        console.error('Error saving match data:', error);
        throw error;
    }
};

const parseEvent = (event: any): any => {
    if (typeof event === 'string') {
        try {
            return JSON.parse(event);
        } catch (error) {
            console.error('Error parsing event string:', error);
            throw new Error('Invalid event format');
        }
    }
    return event;
};

const mapMatchData = (data: any): BackendMatch => {
    return {
        kick_off: new Date(data.utcDate).toUTCString(),
        status: mapStatus(data.status),
        stage: data.stage === 'GROUP_STAGE' ? 'group' : 'finals',
        home_team_id: data.home_team_id,
        away_team_id: data.away_team_id,
        tournament_id: data.tournament_id,
        home_goals: data.home_goals ?? 0,
        away_goals: data.away_goals ?? 0,
        venue: data.venue ?? 'Unknown',
    };
};

const mapStatus = (status: string): 'scheduled' | 'in_progress' | 'finished' | 'draft' => {
    const statusMap: Record<string, 'scheduled' | 'in_progress' | 'finished' | 'draft'> = {
        SCHEDULED: 'scheduled',
        TIMED: 'scheduled',
        IN_PLAY: 'in_progress',
        PAUSED: 'in_progress',
        FINISHED: 'finished',
        POSTPONED: 'scheduled',
        SUSPENDED: 'scheduled',
        CANCELED: 'scheduled',
    };
    return statusMap[status] || 'draft';
};