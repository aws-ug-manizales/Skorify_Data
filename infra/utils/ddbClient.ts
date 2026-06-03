
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  BatchGetCommand,
  GetCommandInput,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

export class DDBClient {
  private ddb: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableNameEnv: string) {
    const tableName = process.env[tableNameEnv];
    if (!tableName) {
      throw new Error(`${tableNameEnv} env var not set`);
    }
    const client = new DynamoDBClient({});
    this.ddb = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async get(params: { [key: string]: unknown }) {
    const query: GetCommandInput = { Key: params, TableName: this.tableName };
    const command = new GetCommand(query);
    return this.ddb.send(command);
  }

  async put(params: { [key: string]: unknown }) {
    const command = new PutCommand({
        TableName: this.tableName,
        Item: params,
    })
    return this.ddb.send(command);
  }

  async getItems(keys: { [key: string]: unknown }[]): Promise<{ [key: string]: unknown }[]> {
    const results: { [key: string]: unknown }[] = [];
    while (keys.length > 0) {
        const batch = keys.splice(0, 100); // DynamoDB BatchGetItem has a limit of 100 items per request
        const command: BatchGetCommand = new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: batch,
            },
          },
        });
      const response = await this.ddb.send(command);
      const items = response.Responses?.[this.tableName] || [];
      results.push(...items);
    }
    return results;
  }
};
