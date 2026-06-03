import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as events from "aws-cdk-lib/aws-events";
import * as ssm from 'aws-cdk-lib/aws-ssm';


import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { SKORIFY_DATA_BUS } from "../constants";

export class SharedResources extends Construct {
  public readonly bus: events.EventBus;
  /** Mapeo fdataId -> postgresId para matches */
  public readonly matchMappingTable: dynamodb.Table;
  /** Mapeo fdataId -> postgresId para teams */
  public readonly teamMappingTable: dynamodb.Table;
  /** Mapeo fdataId -> postgresId para tournaments */
  public readonly tournamentMappingTable: dynamodb.Table;


  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);

    this.bus = new events.EventBus(this, "SkorifyDataBus", {
      eventBusName: SKORIFY_DATA_BUS,
    });

    new ssm.StringParameter(this, 'DataBusNameParam', {
      parameterName: `/skorify/${props.envName}/data-bus-name`,
      stringValue: this.bus.eventBusName,
      description: 'Nombre del Event Bus de Skorify Data',
    });

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

    this.tournamentMappingTable = new dynamodb.Table(this, 'TournamentMappingTable', {
      partitionKey: { name: 'fdataId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}