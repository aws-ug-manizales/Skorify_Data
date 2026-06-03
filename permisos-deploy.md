# Permisos IAM para desplegar skorifyDatabase + skorifyEventBridge

Stacks de CDK del proyecto Skorify Data.
Excluye el NetworkingStack (VPC ya existente).

---

## CloudFormation

```
cloudformation:CreateStack
cloudformation:UpdateStack
cloudformation:DeleteStack
cloudformation:DescribeStacks
cloudformation:DescribeStackEvents
cloudformation:DescribeStackResources
cloudformation:GetTemplate
cloudformation:CreateChangeSet
cloudformation:ExecuteChangeSet
cloudformation:DescribeChangeSet
cloudformation:DeleteChangeSet
```

## S3 (assets CDK — código de Lambdas)

```
s3:CreateBucket
s3:PutObject
s3:GetObject
s3:ListBucket
s3:GetBucketLocation
s3:PutBucketVersioning
s3:GetBucketVersioning
s3:PutEncryptionConfiguration
```

## IAM (roles de ejecución para Lambda y Step Functions)

```
iam:CreateRole
iam:DeleteRole
iam:GetRole
iam:PassRole
iam:AttachRolePolicy
iam:DetachRolePolicy
iam:PutRolePolicy
iam:DeleteRolePolicy
iam:GetRolePolicy
iam:TagRole
```

## SSM Parameter Store

```
ssm:GetParameter
ssm:GetParameters
ssm:PutParameter
ssm:DeleteParameter
ssm:AddTagsToResource
```

## EC2 (solo lectura — VPC existente; CreateNetworkInterface para Lambdas en VPC)

```
ec2:DescribeVpcs
ec2:DescribeSubnets
ec2:DescribeSecurityGroups
ec2:AuthorizeSecurityGroupIngress
ec2:DescribeAvailabilityZones
ec2:DescribeNetworkInterfaces
ec2:CreateNetworkInterface
ec2:DeleteNetworkInterface
```

## RDS (skorifyDatabase)

```
rds:CreateDBInstance
rds:DeleteDBInstance
rds:DescribeDBInstances
rds:ModifyDBInstance
rds:CreateDBSubnetGroup
rds:DeleteDBSubnetGroup
rds:DescribeDBSubnetGroups
rds:AddTagsToResource
rds:ListTagsForResource
rds:CreateDBSnapshot
```

Solo en entornos non-prod (RdsScheduler Lambda):

```
rds:StartDBInstance
rds:StopDBInstance
```

## Secrets Manager (credenciales RDS auto-generadas)

```
secretsmanager:CreateSecret
secretsmanager:DeleteSecret
secretsmanager:DescribeSecret
secretsmanager:GetSecretValue
secretsmanager:PutSecretValue
secretsmanager:TagResource
secretsmanager:PutResourcePolicy
```

## Lambda (1 en non-prod en skorifyDatabase / 9 en skorifyEventBridge)

```
lambda:CreateFunction
lambda:DeleteFunction
lambda:UpdateFunctionCode
lambda:UpdateFunctionConfiguration
lambda:GetFunction
lambda:AddPermission
lambda:RemovePermission
lambda:GetPolicy
lambda:CreateEventSourceMapping
lambda:DeleteEventSourceMapping
lambda:GetEventSourceMapping
lambda:UpdateEventSourceMapping
lambda:TagResource
```

## EventBridge (2 reglas non-prod en skorifyDatabase / 1 bus + 4 reglas en skorifyEventBridge)

```
events:CreateEventBus
events:DeleteEventBus
events:DescribeEventBus
events:PutRule
events:DeleteRule
events:DescribeRule
events:PutTargets
events:RemoveTargets
events:TagResource
```

## SQS (DLQ + FinishMatchQueue + NotifyUserQueue)

```
sqs:CreateQueue
sqs:DeleteQueue
sqs:GetQueueAttributes
sqs:SetQueueAttributes
sqs:GetQueueUrl
sqs:TagQueue
sqs:AddPermission
sqs:RemovePermission
```

## Step Functions (RankingStateMachine + CreateMatchesStateMachine)

```
states:CreateStateMachine
states:DeleteStateMachine
states:DescribeStateMachine
states:UpdateStateMachine
states:TagResource
```

## DynamoDB (MatchMappingTable + TeamMappingTable)

```
dynamodb:CreateTable
dynamodb:DeleteTable
dynamodb:DescribeTable
dynamodb:UpdateTable
dynamodb:TagResource
```

---

## Notas

- El permiso `dynamodb:GetItem` sobre las tablas lo necesita el rol de Step Functions
  (CheckMatchMapping task), no el usuario que despliega. CDK lo agrega automáticamente.
- Si el entorno nunca fue bootstrapped, ejecutar `cdk bootstrap` primero requiere
  AdministratorAccess temporalmente (crea bucket S3, repositorio ECR y roles CDK).
