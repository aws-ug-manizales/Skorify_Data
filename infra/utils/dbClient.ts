import {
    GetSecretValueCommand,
    SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { DBClient } from 'skorifydata';


interface RdsSecret {
    username: string;
    password: string;
    host: string;
    port: number;
    dbname?: string;
}

const secretsManager = new SecretsManagerClient({});

export const buildDbClient = async (): Promise<DBClient> => {
    const secretArn = process.env.DB_SECRET_ARN;
    if (!secretArn) {
        throw new Error('DB_SECRET_ARN env var not set');
    }

    const { SecretString } = await secretsManager.send(
        new GetSecretValueCommand({ SecretId: secretArn }),
    );
    if (!SecretString) {
        throw new Error(`Secret ${secretArn} returned empty value`);
    }
    const secret: RdsSecret = JSON.parse(SecretString);

    const client = new DBClient({
        type: 'postgres',
        host: secret.host,
        port: secret.port,
        database: secret.dbname ?? process.env.DB_NAME ?? 'polla_mundial',
        username: secret.username,
        password: secret.password,
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    return client;
}