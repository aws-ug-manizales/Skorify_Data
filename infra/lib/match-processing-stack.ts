import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sources from "aws-cdk-lib/aws-lambda-event-sources";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sfnTasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { Duration } from "aws-cdk-lib";
import {
  SKORIFY_DATA_BUS,
  EventSources,
  DetailTypes,
  QUEUE_DEFAULTS,
  LAMBDA_DEFAULTS,
  ENV,
} from "./constants";

import { createLambda } from "./utils";

import { createMatchesFlow } from "./constructs/createMatchesFlow";
import { SharedResources } from "./constructs/shared-resources";

export interface MatchProcessingStackProps extends cdk.StackProps {
  envName: string;
  vpcName: string;
  backendUrl: string;
}

export class MatchProcessingStack extends cdk.Stack {
  public readonly bus: events.EventBus;

  constructor(scope: Construct, id: string, props: MatchProcessingStackProps) {
    super(scope, id, props);

    const { envName, vpcName, backendUrl } = props;

    const dbSecretArn = ssm.StringParameter.valueFromLookup(
      this,
      `/skorify/${envName}/db-secret-arn`,
    );

    const m2mCredentialsSecretArn = ssm.StringParameter.valueFromLookup(
      this,
      `/skorify/${envName}/m2m-credentials-arn`,
    );

    const m2mSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      "M2MCredentialsSecret",
      m2mCredentialsSecretArn,
    );

    const vpc = ec2.Vpc.fromLookup(this, "ImportedVpc", { vpcName });

    const sharedResources = new SharedResources(this, "SharedResources", { envName });

    this.bus = sharedResources.bus;

    const matchMappingTable = sharedResources.matchMappingTable;
    const teamMappingTable = sharedResources.teamMappingTable;
    const tournamentMappingTable = sharedResources.tournamentMappingTable;

    const dlq = new sqs.Queue(this, "DLQ", {
      retentionPeriod: Duration.days(14),
    });

    new cloudwatch.Alarm(this, "DLQAlarm", {
      metric: dlq.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(5),
        statistic: "Sum",
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: "Mensajes en la DLQ — partidos que no pudieron procesarse",
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

    const workerLambda = createLambda("WorkerLambda", "lambdas/etl-process/worker.ts", this);
    workerLambda.addEnvironment("EVENT_BUS_NAME", this.bus.eventBusName);
    workerLambda.addEnvironment("MATCH_MAPPING_TABLE", matchMappingTable.tableName);
    workerLambda.addEnvironment("TOURNAMENT_MAPPING_TABLE", tournamentMappingTable.tableName);
    workerLambda.addEnvironment("FOOTBALL_DATA_API_TOKEN", process.env.FOOTBALL_DATA_API_TOKEN || '');
    this.bus.grantPutEventsTo(workerLambda);
    matchMappingTable.grantReadData(workerLambda);
    tournamentMappingTable.grantReadData(workerLambda);

    const finishMatchLambda = createLambda(
      "FinishMatchLambda",
      "lambdas/etl-process/finish-match.ts",
      this
    );
    finishMatchLambda.addEnvironment(ENV.BACKEND_URL, backendUrl);
    finishMatchLambda.addEnvironment(ENV.M2M_SECRET_ARN, m2mCredentialsSecretArn);
    m2mSecret.grantRead(finishMatchLambda);
    finishMatchLambda.addEventSource(
      new sources.SqsEventSource(finishMatchQueue, { batchSize: 1 })
    );

    const notifyUsersLambda = createLambda(
      "NotifyUsersLambda",
      "lambdas/etl-process/notify-users.ts",
      this
    );
    notifyUsersLambda.addEnvironment(ENV.BACKEND_URL, backendUrl);
    notifyUsersLambda.addEnvironment(ENV.M2M_SECRET_ARN, m2mCredentialsSecretArn);
    m2mSecret.grantRead(notifyUsersLambda);
    notifyUsersLambda.addEventSource(
      new sources.SqsEventSource(notifyUserQueue, { batchSize: 1 })
    );

    const calculateRankingLambda = createLambda(
      "CalculateRankingLambda",
      "lambdas/etl-process/calculate-ranking.ts",
      this
    );
    calculateRankingLambda.addEnvironment(ENV.BACKEND_URL, backendUrl);
    calculateRankingLambda.addEnvironment(ENV.M2M_SECRET_ARN, m2mCredentialsSecretArn);
    m2mSecret.grantRead(calculateRankingLambda);
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

    const lambdas = [
      workerLambda,
      finishMatchLambda,
      notifyUsersLambda,
      calculateRankingLambda,
    ];

    const queues = [finishMatchQueue, notifyUserQueue, calculateRankingQueue];

    new cloudwatch.Dashboard(this, "MatchProcessingDashboard", {
      dashboardName: "SkorifyMatchProcessing",
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: "Lambda Invocations",
            left: lambdas.map((l) =>
              l.metricInvocations({ period: Duration.minutes(5), statistic: "Sum" })
            ),
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: "Lambda Errors",
            left: lambdas.map((l) =>
              l.metricErrors({ period: Duration.minutes(5), statistic: "Sum" })
            ),
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: "SQS Visible Messages",
            left: queues.map((q) =>
              q.metricApproximateNumberOfMessagesVisible({
                period: Duration.minutes(5),
                statistic: "Sum",
              })
            ),
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: "DLQ Messages",
            left: [
              dlq.metricApproximateNumberOfMessagesVisible({
                period: Duration.minutes(5),
                statistic: "Sum",
              }),
            ],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: "Lambda Duration (avg)",
            left: lambdas.map((l) =>
              l.metricDuration({ period: Duration.minutes(5), statistic: "Avg" })
            ),
            width: 24,
          }),
        ],
      ],
    });

    new createMatchesFlow(this, "CreateMatchesFlow", { 
      vpc,
      dbSecretArn,
      matchMappingTable,
      teamMappingTable,
      tournamentMappingTable
    });
  }
}
