import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as events from 'aws-cdk-lib/aws-events';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Duration } from 'aws-cdk-lib';
import { RdsScheduler } from './constructs/rds-scheduler';
import { DbMigrations } from './constructs/db-migrations';

export interface DatabaseStackProps extends cdk.StackProps {
  envName: string;
  vpcName: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly opsAlertsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { envName, vpcName } = props;

    const vpc = ec2.Vpc.fromLookup(this, 'ImportedVPC', { vpcName });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Security group for Skorify RDS instance',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow internal connections from the VPC',
    );

    // ── Bastion host (ASG) ───────────────────────────────────────────────────
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'Security group for Skorify bastion host',
      allowAllOutbound: true,
    });

    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH from anywhere (restrict to your IP in production)',
    );

    // Allow the bastion to reach RDS
    dbSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(bastionSecurityGroup.securityGroupId),
      ec2.Port.tcp(5432),
      'Allow connections from bastion host',
    );

    const bastionAsg = new autoscaling.AutoScalingGroup(this, 'BastionAsg', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: bastionSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      keyPair: ec2.KeyPair.fromKeyPairName(this, 'BastionKeyPair', `skorify-${envName}-bastion`),
      minCapacity: 0,
      maxCapacity: 1,
      desiredCapacity: 1,
    });

    new cdk.CfnOutput(this, 'BastionAsgName', {
      value: bastionAsg.autoScalingGroupName,
      description: 'Bastion ASG name — set desired=0 to stop, desired=1 to start',
    });
    // ─────────────────────────────────────────────────────────────────────────

    this.database = new rds.DatabaseInstance(this, 'skorifyDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_18 }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        envName === 'prod' ? ec2.InstanceSize.MEDIUM : ec2.InstanceSize.SMALL,
      ),
      vpc,
      securityGroups: [dbSecurityGroup], 
      vpcSubnets: { 
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      databaseName: 'skorify',
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, 
    });

    // Solo dev/no-prod tienen el scheduler que para/arranca la RDS (ahorro);
    // prod corre 24/7.
    if (envName !== 'prod') {
      new RdsScheduler(this, 'RdsScheduler', {
        databaseInstance: this.database,
        startSchedule: events.Schedule.cron({ minute: '0', hour: '12', weekDay: 'MON-FRI' }),
        stopSchedule: events.Schedule.cron({ minute: '0', hour: '1', weekDay: 'MON-FRI' }),
      });
    }

    // Secreto auto-generado por RDS con las credenciales de admin (user/password).
    // Lo publicamos en SSM para que lambdas u otros consumidores resuelvan el ARN
    // sin depender de outputs cross-stack.
    if (!this.database.secret) {
      throw new Error('RDS instance did not generate a credentials secret');
    }

    new ssm.StringParameter(this, 'DbSecretArnParam', {
      parameterName: `/skorify/${envName}/db-secret-arn`,
      stringValue: this.database.secret.secretArn,
      description: 'ARN del Secrets Manager secret con credenciales de la RDS',
    });

    new DbMigrations(this, 'DbMigrations', {
      vpc,
      dbSecretArn: this.database.secret.secretArn,
      dbName: 'skorify',
      database: this.database,
    });

    // Tópico de alertas operativas. El ARN se publica en SSM para que el
    // backend (repo aparte) enganche sus propias alarmas al mismo tópico.
    this.opsAlertsTopic = new sns.Topic(this, 'OpsAlertsTopic', {
      topicName: `skorify-${envName}-ops-alerts`,
    });

    const opsEmails = [
      'jal.alejandro@gmail.com',
      'santiagoloaizagiraldo@gmail.com',
      'edisoncastrosanchez@gmail.com',
      'awsugmanizales@gmail.com',
    ];
    for (const email of opsEmails) {
      this.opsAlertsTopic.addSubscription(new subscriptions.EmailSubscription(email));
    }

    new ssm.StringParameter(this, 'OpsAlertsTopicArnParam', {
      parameterName: `/skorify/${envName}/ops-alerts-topic-arn`,
      stringValue: this.opsAlertsTopic.topicArn,
      description: 'ARN del tópico SNS de alertas operativas',
    });

    const alertAction = new cwActions.SnsAction(this.opsAlertsTopic);

    // Las t4g son burstables: con el balance de créditos en 0 la instancia
    // queda limitada a su CPU base (ya pasó el 3 de junio de 2026 en dev).
    const cpuCreditAlarm = new cloudwatch.Alarm(this, 'DbCpuCreditBalanceAlarm', {
      metric: this.database.metric('CPUCreditBalance', {
        period: Duration.minutes(15),
        statistic: 'Minimum',
      }),
      threshold: 100,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'Créditos de CPU de la RDS por agotarse — la instancia quedará limitada a su CPU base',
    });
    cpuCreditAlarm.addAlarmAction(alertAction);

    // ~80% del max_connections aproximado de cada clase de instancia:
    // t4g.small ~225 (dev), t4g.medium ~440 (prod).
    const dbConnectionsAlarm = new cloudwatch.Alarm(this, 'DbConnectionsAlarm', {
      metric: this.database.metricDatabaseConnections({
        period: Duration.minutes(5),
        statistic: 'Maximum',
      }),
      threshold: envName === 'prod' ? 350 : 180,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Conexiones a la RDS cerca del límite de la instancia',
    });
    dbConnectionsAlarm.addAlarmAction(alertAction);

    new cdk.CfnOutput(this, 'DBHost', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'Host para el equipo de datos y backend',
    });

    new cdk.CfnOutput(this, 'DBSecretArn', {
      value: this.database.secret.secretArn,
      description: 'ARN del secreto con credenciales de la RDS',
    });
  }
}
// Configuración de RDS para el proyecto Skorify
