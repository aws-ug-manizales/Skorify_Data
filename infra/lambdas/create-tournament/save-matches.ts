import { DBClient } from 'skorifydata';
import {
    GetSecretValueCommand,
    SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface RdsSecret {
    username: string;
    password: string;
    host: string;
    port: number;
    dbname?: string;
    engine?: string;
}

const secretsManager = new SecretsManagerClient({});

// Cacheamos la construcción del DBClient a nivel de módulo para no resolver
// el secreto en cada invocación; warm starts reutilizan la misma instancia.
let dbClientPromise: Promise<DBClient> | null = null;

async function buildDbClient(): Promise<DBClient> {
    const secretArn = process.env.DB_SECRET_ARN;

    if (secretArn) {
        const { SecretString } = await secretsManager.send(
            new GetSecretValueCommand({ SecretId: secretArn }),
        );
        if (!SecretString) {
            throw new Error(`Secret ${secretArn} returned empty value`);
        }
        const secret: RdsSecret = JSON.parse(SecretString);
        console.log({ ...secret, password: undefined }, { depth: null });
        return new DBClient({
            type: 'postgres',
            host: secret.host,
            port: secret.port,
            database: secret.dbname ?? process.env.DB_NAME ?? 'polla_mundial',
            username: secret.username,
            password: secret.password,
            ssl: { rejectUnauthorized: false },
        });
    }

    // Fallback dev local: env vars planas
    return new DBClient({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_NAME ?? 'polla_mundial',
        username: process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'password',
    });
}

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
        const saved = await dbClient.matches.save(matchMapped);
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
        stage: data.stage === 'GROUP_STAGE' ? 'group' : 'finals',
        home_team_id: data.home_team_id,
        away_team_id: data.away_team_id,
        tournament_id: data.tournament_id,
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