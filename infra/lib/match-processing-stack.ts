import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as sources from "aws-cdk-lib/aws-lambda-event-sources";
import { Duration } from "aws-cdk-lib";
import {
  SKORIFY_DATA_BUS,
  EventSources,
  DetailTypes,
  QUEUE_DEFAULTS,
  LAMBDA_DEFAULTS,
  ENV,
} from "./constants";

export class MatchProcessingStack extends cdk.Stack {
  public readonly bus: events.EventBus;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const backendUrl =
      this.node.tryGetContext("backendUrl") ??
      process.env.BACKEND_URL ??
      "";

    this.bus = new events.EventBus(this, "SkorifyDataBus", {
      eventBusName: SKORIFY_DATA_BUS,
    });

    const dlq = new sqs.Queue(this, "DLQ", {
      retentionPeriod: Duration.days(14),
    });

    const createQueue = (name: string): sqs.Queue =>
      new sqs.Queue(this, name, {
        deadLetterQueue: {
          queue: dlq,
          maxReceiveCount: QUEUE_DEFAULTS.maxReceiveCount,
        },
        visibilityTimeout: QUEUE_DEFAULTS.visibilityTimeout,
      });

    const finishMatchQueue = createQueue("FinishMatchQueue");
    const notifyUserQueue = createQueue("NotifyUserQueue");
    const calculateRankingQueue = createQueue("CalculateRankingQueue");

    const createLambda = (name: string, entry: string): nodejs.NodejsFunction =>
      new nodejs.NodejsFunction(this, name, {
        entry,
        handler: "handler",
        runtime: LAMBDA_DEFAULTS.runtime,
        timeout: LAMBDA_DEFAULTS.timeout,
      });

    const workerLambda = createLambda("WorkerLambda", "lambdas/worker.ts");
    workerLambda.addEnvironment(ENV.EVENT_BUS_NAME, this.bus.eventBusName);
    workerLambda.addEnvironment(ENV.BACKEND_URL, backendUrl);
    this.bus.grantPutEventsTo(workerLambda);

    const finishMatchLambda = createLambda(
      "FinishMatchLambda",
      "lambdas/finish-match.ts"
    );
    finishMatchLambda.addEnvironment(ENV.BACKEND_URL, backendUrl);
    finishMatchLambda.addEventSource(
      new sources.SqsEventSource(finishMatchQueue, { batchSize: 1 })
    );

    const notifyUsersLambda = createLambda(
      "NotifyUsersLambda",
      "lambdas/notify-users.ts"
    );
    notifyUsersLambda.addEnvironment(ENV.BACKEND_URL, backendUrl);
    notifyUsersLambda.addEventSource(
      new sources.SqsEventSource(notifyUserQueue, { batchSize: 1 })
    );

    const calculateRankingLambda = createLambda(
      "CalculateRankingLambda",
      "lambdas/calculate-ranking.ts"
    );
    calculateRankingLambda.addEnvironment(ENV.BACKEND_URL, backendUrl);
    calculateRankingLambda.addEventSource(
      new sources.SqsEventSource(calculateRankingQueue, { batchSize: 1 })
    );

    new events.Rule(this, "MatchFinishedSkorifyDataRule", {
      eventBus: this.bus,
      eventPattern: {
        source: [EventSources.SKORIFY_DATA],
        detailType: [DetailTypes.MATCH_FINISHED],
      },
      targets: [new targets.SqsQueue(finishMatchQueue)],
    });

    new events.Rule(this, "NotifyUserSkorifyBackendRule", {
      eventBus: this.bus,
      eventPattern: {
        source: [EventSources.SKORIFY_BACKEND],
        detailType: [DetailTypes.NOTIFY_USER],
      },
      targets: [new targets.SqsQueue(notifyUserQueue)],
    });

    new events.Rule(this, "WorkerScheduleRule", {
      schedule: events.Schedule.rate(Duration.minutes(5)),
      targets: [new targets.LambdaFunction(workerLambda)],
    });

    new events.Rule(this, "CalculateInstanceRankingSkorifyBackendRule", {
      eventBus: this.bus,
      eventPattern: {
        source: [EventSources.SKORIFY_BACKEND],
        detailType: [DetailTypes.CALCULATE_INSTANCE_RANKING],
      },
      targets: [new targets.SqsQueue(calculateRankingQueue)],
    });
  }
}
