import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class EtlStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DLQ - Criterio 4
    const ingestionDLQ = new sqs.Queue(this, 'IngestionDLQ', {
      queueName: 'skorify-matches-dlq',
      retentionPeriod: cdk.Duration.days(14),
    });

    // 2. SQS Principal - Criterio 2 y 3
    const ingestionQueue = new sqs.Queue(this, 'IngestionQueue', {
      queueName: 'skorify-matches-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: ingestionDLQ,
      },
    });

    // 3. Lambda del Processor (La que calcula los puntos)
    const processorLambda = new lambdaNodejs.NodejsFunction(this, 'ProcessorHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../services/ingestion-job/src/handlers/processor.ts'),
      handler: 'handler',
      environment: {
        SQS_URL: ingestionQueue.queueUrl,
      },
    });

    // Conectar SQS con la Lambda del Processor
    processorLambda.addEventSource(new cdk.aws_lambda_event_sources.SqsEventSource(ingestionQueue));

    // 4. Cron de EventBridge - Criterio 1
    const cronRule = new events.Rule(this, 'ExtractionSchedule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
    });

    
  }
}