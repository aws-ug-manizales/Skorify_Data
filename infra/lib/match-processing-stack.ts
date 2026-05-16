import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as sources from "aws-cdk-lib/aws-lambda-event-sources";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sfnTasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Duration } from "aws-cdk-lib";
import {
  SKORIFY_DATA_BUS,
  EventSources,
  DetailTypes,
  QUEUE_DEFAULTS,
  LAMBDA_DEFAULTS,
} from "./constants";
import { createMatchesFlow } from "./constructs/createMatchesFlow";

export interface MatchProcessingStackProps extends cdk.StackProps {
  envName: string;
}

export class MatchProcessingStack extends cdk.Stack {
  public readonly bus: events.EventBus;

  constructor(scope: Construct, id: string, props: MatchProcessingStackProps) {
    super(scope, id, props);

    const { envName } = props;

    const vpcName = ssm.StringParameter.valueFromLookup(
      this,
      `/skorify/${envName}/vpc-name`,
    );

    const dbSecretArn = ssm.StringParameter.valueFromLookup(
      this,
      `/skorify/${envName}/db-secret-arn`,
    );

    const vpc = ec2.Vpc.fromLookup(this, "ImportedVpc", { vpcName });

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

    const createLambda = (name: string, entry: string): nodejs.NodejsFunction =>
      new nodejs.NodejsFunction(this, name, {
        entry,
        handler: "handler",
        runtime: LAMBDA_DEFAULTS.runtime,
        timeout: LAMBDA_DEFAULTS.timeout,
      });

    const workerLambda = createLambda("WorkerLambda", "lambdas/worker.ts");
    workerLambda.addEnvironment("EVENT_BUS_NAME", this.bus.eventBusName);
    this.bus.grantPutEventsTo(workerLambda);

    const finishMatchLambda = createLambda(
      "FinishMatchLambda",
      "lambdas/finish-match.ts"
    );
    finishMatchLambda.addEventSource(
      new sources.SqsEventSource(finishMatchQueue, { batchSize: 10 })
    );

    const notifyUsersLambda = createLambda(
      "NotifyUsersLambda",
      "lambdas/notify-users.ts"
    );
    notifyUsersLambda.addEventSource(
      new sources.SqsEventSource(notifyUserQueue, { batchSize: 10 })
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

    const getInstancesLambda = createLambda(
      "GetTournamentInstancesLambda",
      "lambdas/get-tournament-instances.ts"
    );

    const calcInstanceLambda = createLambda(
      "CalculateInstanceRankingLambda",
      "lambdas/calculate-instance-ranking.ts"
    );

    const calcGlobalLambda = createLambda(
      "CalculateGlobalRankingLambda",
      "lambdas/calculate-global-ranking.ts"
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

    const mapInstancesState = new sfn.Map(this, "MapInstancesPerTournament", {
      itemsPath: "$.instances",
      maxConcurrency: 5,
    });
    mapInstancesState.iterator(calcInstanceTask);

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
        definition: getInstancesTask
          .next(mapInstancesState)
          .next(calcGlobalTask),
        timeout: Duration.minutes(5),
      }
    );

    new events.Rule(this, "MatchFinishedSkorifyBackendRule", {
      eventBus: this.bus,
      eventPattern: {
        source: [EventSources.SKORIFY_BACKEND],
        detailType: [DetailTypes.MATCH_FINISHED],
      },
      targets: [new targets.SfnStateMachine(rankingStateMachine)],
    });

    new createMatchesFlow(this, "CreateMatchesFlow", { vpc, dbSecretArn });
  }
}
