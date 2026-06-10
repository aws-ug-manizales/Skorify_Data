import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface NetworkingStackProps extends cdk.StackProps {
  /** Nombre lógico del ambiente: 'dev' | 'staging' | 'prod' */
  envName: string;
  /** CIDR de la VPC. Default: 10.0.0.0/16 */
  vpcCidr?: string;
}

/**
 * VPC privada sin NAT Gateways para alojar la RDS de Skorify y las lambdas
 * que necesitan acceso a la base. Publica vpc-name y db-sg-id en SSM.
 */
export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    const { envName, vpcCidr = '10.0.0.0/16' } = props;

    const vpcName = `vpc-skorify-${envName}`;

    this.vpc = new ec2.Vpc(this, 'SkorifyVpc', {
      vpcName,
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: this.vpc,
      description: `Security group for Skorify RDS (${envName})`,
      allowAllOutbound: false,
    });

    // Interface Endpoint para Secrets Manager: permite a las lambdas dentro
    // de la VPC privada llegar a la API de SM sin pasar por internet/NAT.
    // Configurado en una sola AZ para ahorrar costo (~$7/mes vs ~$15/mes en 2 AZ).
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnets: [this.vpc.isolatedSubnets[0]!] },
    });

    // Gateway Endpoint para DynamoDB: ruta en las route tables de la VPC.
    // Es gratis (no cobra ni por hora ni por GB), no requiere ENIs ni SG.
    this.vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    new ssm.StringParameter(this, 'VpcNameParam', {
      parameterName: `/skorify/${envName}/vpc-name`,
      stringValue: vpcName,
      description: 'Name tag de la VPC de Skorify; consumido por DatabaseStack',
    });

    new ssm.StringParameter(this, 'DbSgIdParam', {
      parameterName: `/skorify/${envName}/db-sg-id`,
      stringValue: this.dbSecurityGroup.securityGroupId,
      description: 'Security Group ID para la RDS; consumido por DatabaseStack',
    });

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    new cdk.CfnOutput(this, 'DbSgId', {
      value: this.dbSecurityGroup.securityGroupId,
    });
  }
}
