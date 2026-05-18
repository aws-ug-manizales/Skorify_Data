import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sfnTasks from "aws-cdk-lib/aws-stepfunctions-tasks";

import { createLambda } from "../utils";
import { LAMBDA_DEFAULTS } from '../constants';

export interface CreateMatchesFlowProps {
  /** VPC donde corren las lambdas que necesitan acceso a la RDS */
  vpc: ec2.IVpc;
  dbSecretArn: string;
}

export class createMatchesFlow extends Construct {
  public readonly matchesByCompetitionLambda: NodejsFunction;
  public readonly resolveTeamsLambda: NodejsFunction;
  public readonly saveMatchesLambda: NodejsFunction;
  public readonly createMatchesSFn: sfn.StateMachine;
  /** Mapeo fdataId -> postgresId para matches */
  public readonly matchMappingTable: dynamodb.Table;
  /** Mapeo fdataId -> postgresId para teams */
  public readonly teamMappingTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: CreateMatchesFlowProps) {
    super(scope, id);

    // Tablas de mapeo entre IDs externos de football-data y los IDs internos de Postgres.
    // Se populan desde el flujo de save-matches.
    this.matchMappingTable = new dynamodb.Table(this, 'MatchMappingTable', {
      partitionKey: { name: 'fdataId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.teamMappingTable = new dynamodb.Table(this, 'TeamMappingTable', {
      partitionKey: { name: 'fdataId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.matchesByCompetitionLambda = createLambda(
      "GetMatchesByCompetitionLambda",
      path.join(__dirname, '..', '..', 'lambdas', 'get-matches-by-competition.ts'),
      this
    );

    this.matchesByCompetitionLambda.addEnvironment("FOOTBALL_DATA_API_TOKEN", process.env.FOOTBALL_DATA_API_TOKEN || '');

    this.resolveTeamsLambda = new NodejsFunction(this, 'ResolveTeamsLambda', {
      entry: path.join(__dirname, '..', '..', 'lambdas', 'resolve-teams.ts'),
      handler: 'handler',
      runtime: LAMBDA_DEFAULTS.runtime,
      timeout: LAMBDA_DEFAULTS.timeout,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      environment: {
        DB_SECRET_ARN: props.dbSecretArn,
        TEAM_MAPPING_TABLE: this.teamMappingTable.tableName,
      },
    });

    this.resolveTeamsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.dbSecretArn],
      }),
    );
    this.teamMappingTable.grantReadWriteData(this.resolveTeamsLambda);

    this.saveMatchesLambda = new NodejsFunction(this, 'SaveMatchesLambda', {
      entry: path.join(__dirname, '..', '..', 'lambdas', 'save-matches.ts'),
      handler: 'handler',
      runtime: LAMBDA_DEFAULTS.runtime,
      timeout: LAMBDA_DEFAULTS.timeout,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      environment: {
        DB_SECRET_ARN: props.dbSecretArn,
        MATCH_MAPPING_TABLE: this.matchMappingTable.tableName,
      }
    });

    this.saveMatchesLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.dbSecretArn],
      }),
    );
    this.matchMappingTable.grantReadWriteData(this.saveMatchesLambda);

    const getMatchesTask = new sfnTasks.LambdaInvoke(this, 'GetMatchesByCompetition', {
      lambdaFunction: this.matchesByCompetitionLambda,
      outputPath: '$.Payload'
    });

    // Por cada match: chequea si ya existe en el mapping; si sí, skip.
    // Si no, resuelve teams (crea en postgres si faltan) y guarda el match.
    const checkMatchMappingTask = new sfnTasks.DynamoGetItem(this, 'CheckMatchMapping', {
      table: this.matchMappingTable,
      key: {
        fdataId: sfnTasks.DynamoAttributeValue.fromString(
          sfn.JsonPath.format('{}', sfn.JsonPath.stringAt('$.id')),
        ),
      },
      resultPath: '$.matchMapping',
    });

    const skipExistingMatch = new sfn.Succeed(this, 'SkipExistingMatch');

    const resolveTeamsTask = new sfnTasks.LambdaInvoke(this, 'ResolveTeams', {
      lambdaFunction: this.resolveTeamsLambda,
      inputPath: '$',
      outputPath: '$.Payload',
    });

    const saveMatchesTask = new sfnTasks.LambdaInvoke(this, 'SaveMatches', {
      lambdaFunction: this.saveMatchesLambda,
      inputPath: '$',
      outputPath: '$.Payload'
    });

    const matchPipeline = checkMatchMappingTask.next(
      new sfn.Choice(this, 'MatchExistsInMapping?')
        .when(
          sfn.Condition.isPresent('$.matchMapping.Item'),
          skipExistingMatch,
        )
        .otherwise(resolveTeamsTask.next(saveMatchesTask)),
    );

    const matchesMap = new sfn.Map(this, 'MatchesMap', {
      itemsPath: '$.matches',
      resultPath: sfn.JsonPath.DISCARD,
      maxConcurrency: 5
    });
    matchesMap.itemProcessor(matchPipeline);

    this.createMatchesSFn = new sfn.StateMachine(this, 'CreateMatchesStateMachine', {
      definition: getMatchesTask.next(matchesMap),
      timeout: cdk.Duration.minutes(5)
    });
  }
}