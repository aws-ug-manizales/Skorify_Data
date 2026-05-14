import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as sources from "aws-cdk-lib/aws-lambda-event-sources";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sfnTasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Duration } from "aws-cdk-lib";

export class EventBridgeStack extends cdk.Stack {
  public readonly bus: events.EventBus;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bus = new events.EventBus(this, "SkorifyDataBus", {
      eventBusName: "SkorifyDataBus",
    });

    const dlq = new sqs.Queue(this, "DLQ", {
      retentionPeriod: Duration.days(14),
    });

    const finishMatchQueue = new sqs.Queue(this, "FinishMatchQueue", {
      deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
      visibilityTimeout: Duration.seconds(60),
    });

    const notifyUserQueue = new sqs.Queue(this, "NotifyUserQueue", {
      deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
      visibilityTimeout: Duration.seconds(60),
    });

    const workerLambda = new nodejs.NodejsFunction(this, "WorkerLambda", {
      entry: "lambdas/worker.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      environment: {
        EVENT_BUS_NAME: this.bus.eventBusName,
      },
    });
    this.bus.grantPutEventsTo(workerLambda);

    const finishMatchLambda = new nodejs.NodejsFunction(this, "FinishMatchLambda", {
      entry: "lambdas/finish-match.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
    });
    finishMatchLambda.addEventSource(
      new sources.SqsEventSource(finishMatchQueue, { batchSize: 10 })
    );

    const notifyUsersLambda = new nodejs.NodejsFunction(this, "NotifyUsersLambda", {
      entry: "lambdas/notify-users.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
    });
    notifyUsersLambda.addEventSource(
      new sources.SqsEventSource(notifyUserQueue, { batchSize: 10 })
    );

    new events.Rule(this, "MatchFinishedSkorifyDataRule", {
      eventBus: this.bus,
      eventPattern: {
        source: ["SkorifyData"],
        detailType: ["MatchFinished"],
      },
      targets: [new targets.SqsQueue(finishMatchQueue)],
    });

    new events.Rule(this, "NotifyUserSkorifyBackendRule", {
      eventBus: this.bus,
      eventPattern: {
        source: ["SkorifyBackend"],
        detailType: ["NotifyUser"],
      },
      targets: [new targets.SqsQueue(notifyUserQueue)],
    });

    new events.Rule(this, "WorkerScheduleRule", {
      schedule: events.Schedule.rate(Duration.minutes(5)),
      targets: [new targets.LambdaFunction(workerLambda)],
    });

    const getInstancesLambda = new nodejs.NodejsFunction(
      this,
      "GetTournamentInstancesLambda",
      {
        entry: "lambdas/get-tournament-instances.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: Duration.seconds(30),
      }
    );

    const calcInstanceLambda = new nodejs.NodejsFunction(
      this,
      "CalculateInstanceRankingLambda",
      {
        entry: "lambdas/calculate-instance-ranking.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: Duration.seconds(30),
      }
    );

    const calcGlobalLambda = new nodejs.NodejsFunction(
      this,
      "CalculateGlobalRankingLambda",
      {
        entry: "lambdas/calculate-global-ranking.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_22_X,
        timeout: Duration.seconds(30),
      }
    );

    const getInstancesTask = new sfnTasks.LambdaInvoke(
      this,
      "GetTournamentInstancesTask",
      {
        lambdaFunction: getInstancesLambda,
        outputPath: "$.Payload",
      }
    );

    const calcInstanceTask = new sfnTasks.LambdaInvoke(
      this,
      "CalculateInstanceRankingTask",
      {
        lambdaFunction: calcInstanceLambda,
        outputPath: "$.Payload",
      }
    );

    const mapState = new sfn.Map(this, "MapInstances", {
      itemsPath: "$.instances",
      maxConcurrency: 5,
    });
    mapState.iterator(calcInstanceTask);

    const calcGlobalTask = new sfnTasks.LambdaInvoke(
      this,
      "CalculateGlobalRankingTask",
      {
        lambdaFunction: calcGlobalLambda,
        outputPath: "$.Payload",
      }
    );

    const rankingStateMachine = new sfn.StateMachine(
      this,
      "RankingStateMachine",
      {
        definition: getInstancesTask.next(mapState).next(calcGlobalTask),
        timeout: Duration.minutes(5),
      }
    );

    new events.Rule(this, "MatchFinishedSkorifyBackendRule", {
      eventBus: this.bus,
      eventPattern: {
        source: ["SkorifyBackend"],
        detailType: ["MatchFinished"],
      },
      targets: [new targets.SfnStateMachine(rankingStateMachine)],
    });
  }
}
