#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { DatabaseStack } from "../lib/db-stack";
import { EventBridgeStack } from "../lib/eventbridge-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new DatabaseStack(app, "skorifyDatabase", { env });
new EventBridgeStack(app, "skorifyEventBridge", { env });
