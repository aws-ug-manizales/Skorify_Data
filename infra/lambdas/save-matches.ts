import { DBClient } from 'skorifydata';
import {
    GetSecretValueCommand,
    SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

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
        await dbClient.matches.create(matchData);
        console.log('Match data saved successfully.');
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
            throw new Error('Invalid event format');
        }
    }
    return event;
};