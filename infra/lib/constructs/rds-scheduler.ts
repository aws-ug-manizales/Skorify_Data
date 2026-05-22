import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LAMBDA_DEFAULTS } from '../constants';

export interface RdsSchedulerProps {
  readonly databaseInstance: rds.IDatabaseInstance | null;
  readonly startSchedule: events.Schedule;
  readonly stopSchedule: events.Schedule;
}

export class RdsScheduler extends Construct {
  public readonly handler: NodejsFunction;

  constructor(scope: Construct, id: string, props: RdsSchedulerProps) {
    super(scope, id);

    this.handler = new NodejsFunction(this, 'Handler', {
      entry: path.join(__dirname, '..', '..', 'lambdas','rds-sidecars', 'rds-scheduler.ts'),
      handler: 'handler',
      runtime: LAMBDA_DEFAULTS.runtime,
      timeout: cdk.Duration.minutes(1),
      environment: {
        DB_INSTANCE_IDENTIFIER: props.databaseInstance?.instanceIdentifier || '',
      },
    });

    this.handler.addToRolePolicy(new iam.PolicyStatement({
      actions: ['rds:DescribeDBInstances'],
      resources: ['*'],
    }));

    if (props.databaseInstance) {
      this.handler.addToRolePolicy(new iam.PolicyStatement({
        actions: ['rds:StartDBInstance', 'rds:StopDBInstance'],
        resources: [props.databaseInstance?.instanceArn],
      }));
    }

    new events.Rule(this, 'StartRule', {
      schedule: props.startSchedule,
      targets: [new targets.LambdaFunction(this.handler, {
        event: events.RuleTargetInput.fromObject({ action: 'start' }),
      })],
    });

    new events.Rule(this, 'StopRule', {
      schedule: props.stopSchedule,
      targets: [new targets.LambdaFunction(this.handler, {
        event: events.RuleTargetInput.fromObject({ action: 'stop' }),
      })],
    });
  }
}
