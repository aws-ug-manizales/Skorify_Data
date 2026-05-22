import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
// import { Trigger } from 'aws-cdk-lib/triggers';
import { Construct } from 'constructs';

import { LAMBDA_DEFAULTS } from '../constants';

export interface DbMigrationsProps {
  vpc: ec2.IVpc;
  /** ARN del secret de Secrets Manager con las credenciales de la RDS */
  dbSecretArn: string;
  dbName?: string;
  /** Instancia RDS: garantiza que el Trigger corre solo cuando la DB está disponible */
  database: rds.IDatabaseInstance;
}

/** Genera un hash corto del contenido del directorio de migraciones.
 *  Cambia cuando se agrega o modifica un archivo → fuerza re-ejecución del Trigger. */
function migrationsHash(dir: string): string {
  const files = fs.readdirSync(dir).sort();
  const hash = crypto.createHash('sha256');
  for (const f of files) {
    hash.update(f);
    hash.update(fs.readFileSync(path.join(dir, f)));
  }
  return hash.digest('hex').slice(0, 12);
}

/**
 * Despliega una Lambda que corre `knex migrate:latest` contra la RDS.
 * Se ejecuta automáticamente en cada `cdk deploy` cuando cambia el código
 * de la lambda o el contenido del directorio de migraciones.
 */
export class DbMigrations extends Construct {
  constructor(scope: Construct, id: string, props: DbMigrationsProps) {
    super(scope, id);

    const { vpc, dbSecretArn, dbName = 'skorify', database } = props;

    const migrationsDir = path.join(__dirname, '..', '..', '..', 'migrations');
    const hash = migrationsHash(migrationsDir);

    const migrationLambda = new NodejsFunction(this, 'MigrationLambda', {
      entry: path.join(__dirname, '..', '..', 'lambdas','rds-sidecars', 'run-migrations.ts'),
      handler: 'handler',
      runtime: LAMBDA_DEFAULTS.runtime,
      // Migraciones pueden tardar en DBs frías; 2 min es suficiente margen
      timeout: cdk.Duration.minutes(2),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      environment: {
        DB_SECRET_ARN: dbSecretArn,
        DB_NAME: dbName,
        // El hash cambia cuando se agregan/modifican archivos de migración,
        // lo que actualiza la Lambda y dispara el Trigger en el siguiente deploy.
        MIGRATIONS_HASH: hash,
      },
      bundling: {
        // Marcar clientes de BD opcionales como externos para que esbuild no falle
        // al intentar resolver sus requires dinámicos. Solo pg es necesario.
        externalModules: [
          'mysql', 'mysql2', 'sqlite3', 'better-sqlite3', 'tedious', 'oracledb', 'pg-native',
        ],
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          // Copia el directorio de migraciones al bundle de la Lambda.
          // inputDir es el directorio raíz del proyecto (infra/), las migraciones
          // están un nivel arriba en el repositorio.
          afterBundling: (inputDir: string, outputDir: string) => [
            `cp -r "${inputDir}/../migrations" "${outputDir}/migrations"`,
          ],
        },
      },
    });

    // Permiso mínimo: solo leer este secreto específico
    migrationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [dbSecretArn],
      }),
    );

    // Trigger ejecuta la Lambda como Custom Resource en cada cdk deploy.
    // executeOnHandlerChange: re-ejecuta cuando cambia el código o el MIGRATIONS_HASH.
    // const trigger = new Trigger(this, 'MigrationTrigger', {
    //   handler: migrationLambda,
    //   executeOnHandlerChange: true,
    // });

    // // CloudFormation esperará que la RDS esté en CREATE_COMPLETE antes de invocar
    // // el Trigger. Evita errores de conexión en el primer deploy.
    // trigger.node.addDependency(database);
  }
}
