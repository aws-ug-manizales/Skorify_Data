import {
  RDSClient,
  StartDBInstanceCommand,
  StopDBInstanceCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';

export interface SchedulerEvent {
  action: 'start' | 'stop';
}

export interface SchedulerResult {
  action: 'start' | 'stop';
  status?: string;
  noop?: boolean;
}

const client = new RDSClient({});
const dbInstanceIdentifier = process.env.DB_INSTANCE_IDENTIFIER;

export const handler = async (event: SchedulerEvent): Promise<SchedulerResult> => {
  if (!dbInstanceIdentifier) {
    throw new Error('DB_INSTANCE_IDENTIFIER env var is required');
  }

  const { action } = event;

  const describe = await client.send(new DescribeDBInstancesCommand({
    DBInstanceIdentifier: dbInstanceIdentifier,
  }));
  const status = describe.DBInstances?.[0]?.DBInstanceStatus;

  if (action === 'start' && status === 'stopped') {
    await client.send(new StartDBInstanceCommand({ DBInstanceIdentifier: dbInstanceIdentifier }));
    return { action, status: 'starting' };
  }

  if (action === 'stop' && status === 'available') {
    await client.send(new StopDBInstanceCommand({ DBInstanceIdentifier: dbInstanceIdentifier }));
    return { action, status: 'stopping' };
  }

  return { action, status, noop: true };
};
