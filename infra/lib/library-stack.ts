import * as cdk from 'aws-cdk-lib';
import * as codeartifact from 'aws-cdk-lib/aws-codeartifact';
import { Construct } from 'constructs';

const DOMAIN_NAME = 'skorify';
const UPSTREAM_REPOSITORY_NAME = 'npm-store';
const REPOSITORY_NAME = 'skorify-library';

export class SkorifyLibraryStack extends cdk.Stack {
  public readonly domain: codeartifact.CfnDomain;
  public readonly repository: codeartifact.CfnRepository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.domain = new codeartifact.CfnDomain(this, 'Domain', {
      domainName: DOMAIN_NAME,
    });

    const npmStore = new codeartifact.CfnRepository(this, 'NpmStoreRepository', {
      domainName: this.domain.domainName,
      repositoryName: UPSTREAM_REPOSITORY_NAME,
      description: 'Proxy de la npm pública para resolver dependencias transitivas',
      externalConnections: ['public:npmjs'],
    });
    npmStore.addDependency(this.domain);

    this.repository = new codeartifact.CfnRepository(this, 'SkorifyLibrary', {
      domainName: this.domain.domainName,
      repositoryName: REPOSITORY_NAME,
      description: 'Modelos compartidos de Skorify (paquete skorifydata)',
      upstreams: [UPSTREAM_REPOSITORY_NAME],
    });
    this.repository.addDependency(npmStore);

    new cdk.CfnOutput(this, 'DomainName', { value: this.domain.domainName });
    new cdk.CfnOutput(this, 'RepositoryName', { value: REPOSITORY_NAME });
  }
}
