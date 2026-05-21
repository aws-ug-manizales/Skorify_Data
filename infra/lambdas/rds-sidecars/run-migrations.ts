import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import Knex from 'knex';
import path from 'path';

interface RdsSecret {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname?: string;
}

const secretsManager = new SecretsManagerClient({});

export const handler = async (): Promise<{ batch: number; ran: string[] }> => {
  const secretArn = process.env.DB_SECRET_ARN;
  if (!secretArn) throw new Error('DB_SECRET_ARN not set');

  const { SecretString } = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );
  if (!SecretString) throw new Error('Secret returned empty');

  const secret: RdsSecret = JSON.parse(SecretString);

  const db = Knex({
    client: 'pg',
    connection: {
      host: secret.host,
      port: secret.port,
      database: secret.dbname ?? process.env.DB_NAME ?? 'skorify',
      user: secret.username,
      password: secret.password,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.join(__dirname, 'migrations'),
    },
  });

  try {
    const [batch, ran] = await db.migrate.latest();
    console.log(`Batch ${batch} — ran: ${ran.join(', ') || 'none (already up to date)'}`);
    return { batch, ran };
  } finally {
    await db.destroy();
  }
};
