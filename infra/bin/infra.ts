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

const vpcName: string =
    app.node.tryGetContext("vpcName") ?? `skorify-${ envName }-vpc`;


const backendUrl =
    app.node.tryGetContext("backendUrl") ?? process.env.BACKEND_URL ?? "";

new DatabaseStack(app, `skorify-database-${ envName }`, { env, envName, vpcName });
new MatchProcessingStack(app, `skorify-event-bridge-${ envName }`, { env, envName, vpcName, backendUrl });
