import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as events from 'aws-cdk-lib/aws-events';
import { RdsScheduler } from './constructs/rds-scheduler';

export class DatabaseStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // this.vpc = new ec2.Vpc(this, 'MyVPC', {
    //   maxAzs: 2,
    //   natGateways: 0,
    //   subnetConfiguration: [
    //     {
    //       name: 'isolated',
    //       subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    //       cidrMask: 24,
    //     },
    //   ],
    // });

    // this.database = new rds.DatabaseInstance(this, 'skorifyDatabase', {
    //   engine: rds.DatabaseInstanceEngine.MYSQL,
    //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    //   vpc: this.vpc,
    //   vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    // });
  }
}
