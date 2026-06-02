import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { initBackedClient } from '../../utils/backend-client';
import type { BackendMatch } from '../../utils/types';
import { createEventLogger } from '../../utils/logger';


const logger = createEventLogger("SaveMatchesLambda");
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const backend = initBackedClient(logger);

export const handler = async (event: any): Promise<void> => {
    
    try {
        const matchData = parseEvent(event);
        logger.started(matchData.id, "Received event to save match data", { event });
        const matchMapped = mapMatchData(matchData);
        const saved = await backend.createMatch(matchMapped);
        logger.info(matchData.id, 'Match data saved successfully', { event, postgresId: saved.id });

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
            logger.info(matchData.id, `Mapping written: fdataId=${matchData.id} -> postgresId=${saved.id}`, { event });
        }
        logger.success(matchData.id, "Match data processing completed", { event, postgresId: saved.id });
    } catch (error) {
        logger.failed("Error", 'Error saving match data:', { event, error });
        throw error;
    }
};

const parseEvent = (event: any): any => {
    if (typeof event === 'string') {
        try {
            return JSON.parse(event);
        } catch (error) {
            logger.failed('event', 'Error parsing event string:', { event, error });
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