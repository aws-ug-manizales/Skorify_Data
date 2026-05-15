import { Duration } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export const SKORIFY_DATA_BUS = "SkorifyDataBus";

export const EventSources = {
  SKORIFY_DATA: "SkorifyData",
  SKORIFY_BACKEND: "SkorifyBackend",
} as const;

export const DetailTypes = {
  MATCH_FINISHED: "MatchFinished",
  NOTIFY_USER: "NotifyUser",
} as const;

export const QUEUE_DEFAULTS = {
  maxReceiveCount: 3,
  visibilityTimeout: Duration.seconds(90),
};

export const LAMBDA_DEFAULTS = {
  runtime: Runtime.NODEJS_22_X,
  timeout: Duration.seconds(30),
};

export const ENV = {
  BACKEND_URL: "BACKEND_URL",
  EVENT_BUS_NAME: "EVENT_BUS_NAME",
} as const;
