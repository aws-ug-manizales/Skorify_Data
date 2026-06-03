import type { SQSEvent, SQSRecord, SQSBatchResponse } from "aws-lambda";
import { initBackedClient } from "../../utils/backend-client.js";
import { createEventLogger } from "../../utils/logger.js";
import { RetryExhaustedError } from "../../utils/retry.js";

const logger = createEventLogger("NotifyUsersLambda");
const backend = initBackedClient(logger);

function parseRecord(record: SQSRecord): Record<string, unknown> | null {
  try {
    const body = JSON.parse(record.body);

    if (body.detail) {
      return body.detail;
    }

    return body;
  } catch {
    return null;
  }
}

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  logger.started("batch", `Received ${event.Records.length} record(s)`);

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    const detail = parseRecord(record);

    if (!detail) {
      console.error("Failed to parse SQS record:", record.messageId);
      batchItemFailures.push({ itemIdentifier: record.messageId });
      continue;
    }

    const eventKey = (detail.match_id ?? record.messageId) as string;

    logger.started(eventKey, "Sending notifications", { payload: detail });

    try {
      await backend.notifyUsers(detail);
      logger.success(eventKey, "Users notified successfully", {
        payload: detail,
      });
    } catch (error) {
      if (error instanceof RetryExhaustedError) {
        logger.failed(
          eventKey,
          `All notification retries exhausted after ${error.attempts} attempts`,
          error.lastError
        );
      } else {
        logger.failed(eventKey, "Failed to notify users", error);
      }
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
