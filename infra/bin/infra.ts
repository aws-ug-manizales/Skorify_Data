#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
//import { SkorifyLibraryStack } from '../lib/library-stack';
import { DatabaseStack } from '../lib/db-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// propuesta para store de la libreria
// if (isProduction) {
//  new SkorifyLibraryStack(app, 'SkorifyLibraryStack', { env });
// }

new DatabaseStack(app, 'skorifyDatabase', { env });
