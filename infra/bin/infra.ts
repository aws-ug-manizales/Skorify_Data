#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/db-stack';
import { EtlStack } from '../lib/etl-stack'; // 1. Importar el etl

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};


const dbStack = new DatabaseStack(app, 'skorifyDatabase', { env });

// 2. Registro de Stack de Ingesta y Procesamiento
new EtlStack(app, 'skorifyEtlStack', { 
  env,
 
});