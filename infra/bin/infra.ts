#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { DatabaseStack } from "../lib/db-stack";
import { MatchProcessingStack } from "../lib/match-processing-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const envName: string =
  app.node.tryGetContext("env") ?? process.env.ENV_NAME ?? "dev";

new DatabaseStack(app, "skorifyDatabase", { env, envName });
new MatchProcessingStack(app, "skorifyEventBridge", { env, envName });
