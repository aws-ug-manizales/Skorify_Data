import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { LAMBDA_DEFAULTS } from "./constants";
import { Construct } from "constructs";


export const createLambda = (name: string, entry: string, cls: Construct): nodejs.NodejsFunction =>
    new nodejs.NodejsFunction(cls, name, {
        entry,
        handler: "handler",
        runtime: LAMBDA_DEFAULTS.runtime,
        timeout: LAMBDA_DEFAULTS.timeout,
    });
