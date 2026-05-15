import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as events from 'aws-cdk-lib/aws-events';
import { RdsScheduler } from './constructs/rds-scheduler';

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    const vpc = ec2.Vpc.fromLookup(this, 'ImportedVPC', {
      vpcName: 'VPC-SKORIFY-DEV', // cambiar por nombre de la vpc
    });

    
    const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this, 
      'ImportedDBSecurityGroup', 
      'sg-0123456789abcdef', // cambiar al id correcto
      { mutable: true } 
    );

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(3306),
      'Permitir conexión interna desde la VPC'
    );

    this.database = new rds.DatabaseInstance(this, 'skorifyDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      securityGroups: [dbSecurityGroup], 
      vpcSubnets: { 
        
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED // no se si es isolated o  whit egress
      },
      databaseName: 'skorify',
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, 
    });

    new RdsScheduler(this, 'RdsScheduler', {
      databaseInstance: this.database,
      startSchedule: events.Schedule.cron({ minute: '0', hour: '12', weekDay: 'MON-FRI' }),
      stopSchedule: events.Schedule.cron({ minute: '0', hour: '1', weekDay: 'MON-FRI' }),
    });

    new cdk.CfnOutput(this, 'DBHost', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'Host para el equipo de datos y backend',
    });
  }
}
// Configuración de RDS para el proyecto Skorify
