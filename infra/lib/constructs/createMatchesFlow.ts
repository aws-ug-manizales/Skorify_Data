import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sfnTasks from "aws-cdk-lib/aws-stepfunctions-tasks";


export class createMatchesFlow extends Construct {
  public readonly matchesByCompetitionLambda: NodejsFunction;
  public readonly saveMatchesLambda: NodejsFunction;
    public readonly createMatchesSFn: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);

    this.matchesByCompetitionLambda = new NodejsFunction(this, 'MatchesByCompetitionLambda', {
      entry: path.join(__dirname, '..', '..', 'lambdas', 'get-matches-by-competition.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(1),
      environment: {
        FOOTBALL_DATA_API_TOKEN: process.env.FOOTBALL_DATA_API_TOKEN || '',
      }
    });

    this.saveMatchesLambda = new NodejsFunction(this, 'SaveMatchesLambda', {
      entry: path.join(__dirname, '..', '..', 'lambdas', 'save-matches.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(1)
    });

    const getMatchesTask = new sfnTasks.LambdaInvoke(this, 'GetMatchesByCompetition', {
      lambdaFunction: this.matchesByCompetitionLambda,
      outputPath: '$.Payload'
    });

    const saveMatchesTask = new sfnTasks.LambdaInvoke(this, 'SaveMatches', {
      lambdaFunction: this.saveMatchesLambda,
      inputPath: '$',
      outputPath: '$.Payload'
    });

    const matchesMap = new sfn.Map(this, 'MatchesMap', {
      itemsPath: '$.matches',
      resultPath: sfn.JsonPath.DISCARD
    });
    matchesMap.itemProcessor(saveMatchesTask);

    this.createMatchesSFn = new sfn.StateMachine(this, 'CreateMatchesStateMachine', {
      definition: getMatchesTask.next(matchesMap),
      timeout: cdk.Duration.minutes(5)
    });
  }
}