import { DBClient } from 'skorifydata';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

import { BuiltEntityDomainEvent, Id } from '@skorify/domain/core';
import { MatchEntity } from '@skorify/domain/match';
import { buildDbClient } from '../../utils/dbClient';



const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface RdsSecret {
    username: string;
    password: string;
    host: string;
    port: number;
    dbname?: string;
    engine?: string;
}

// Cacheamos la construcción del DBClient a nivel de módulo para no resolver
// el secreto en cada invocación; warm starts reutilizan la misma instancia.
let dbClientPromise: Promise<DBClient> | null = null;

function getDbClient(): Promise<DBClient> {
    if (!dbClientPromise) {
        dbClientPromise = buildDbClient();
    }
    return dbClientPromise;
}

export const handler = async (event: any): Promise<void> => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('Saving matches data:', JSON.stringify(event, null, 2));

    const dbClient = await getDbClient();
    console.log('DB client initialized, saving match data...');
    try {
        await dbClient.connect();
        console.log('DB client connected successfully.');
        const matchData = parseEvent(event);
        const matchMapped = mapMatchData(matchData);
        const match = MatchEntity.build({
            id: crypto.randomUUID(),
            tournamentId: matchMapped.tournament_id,
            homeTeamId: matchMapped.home_team_id,
            awayTeamId: matchMapped.away_team_id,
            kickOff: matchMapped.kick_off,
            status: matchMapped.status,
            stage: matchMapped.stage,
            createdAt: new Date(),
        });

        if(!match.is(BuiltEntityDomainEvent)) {
            throw new Error(`Failed to build match entity for match ${matchData.id}`);
        }

        const db = await getDbClient();
        const saved = await db.matches.save(match.payload as MatchEntity);
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
    } finally {
        await dbClient.disconnect();
    }
};

const parseEvent = (event: any): any => {
    if (typeof event === 'string') {
        try {
            return JSON.parse(event);
        } catch (error) {
            console.error('Error parsing event string:', error);
            throw new Error('Invalid event format', { cause: error });
        }
    }
    return event;
};

const mapMatchData = (data: any): any => {
    return {
        kick_off: new Date(data.utcDate),
        status: mapStatus(data.status),
        stage: getStage(data.stage),
        home_team_id: data.home_team_id,
        away_team_id: data.away_team_id,
        tournament_id: data.tournament_id,
    };
};

const getStage = (stage: string): 'group' | 'finals' => {
    const stageMap: Record<string, 'group' | 'finals'> = {
        'GROUP_STAGE': 'group',
        'LAST_16': 'finals',
        'LAST_32': 'finals',
        'QUARTER_FINALS': 'finals',
        'SEMI_FINALS': 'finals',
        'THIRD_PLACE': 'finals',
        'FINAL': 'finals',
    };
    const stageMapped = stageMap[stage];
    if (!stageMapped) {
        console.warn(`Unknown stage "${stage}", defaulting to "group"`);
        throw new Error(`Unknown stage "${stage}"`); // Opción: lanzar error para forzar corrección de datos en origen
    }
    return stageMapped;
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