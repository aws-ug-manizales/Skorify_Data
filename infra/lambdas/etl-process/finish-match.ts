import type { SQSEvent, SQSRecord } from "aws-lambda";
import { initBackedClient } from "../../utils/backend-client.js";
import { createEventLogger } from "../../utils/logger.js";
import { RetryExhaustedError } from "../../utils/retry.js";
import type { MatchFinishedDetail } from "../../utils/types.js";

const logger = createEventLogger("FinishMatchLambda");
const backend = initBackedClient(logger);

function parseRecord(record: SQSRecord): MatchFinishedDetail | null {
  try {
    const body = JSON.parse(record.body);

    if (body["detail-type"] === "MatchFinished" && body.detail) {
      return body.detail as MatchFinishedDetail;
    }

    if (body.detail) {
      return body.detail as MatchFinishedDetail;
    }

    return body as MatchFinishedDetail;
  } catch {
    return null;
  }
}

export const handler = async (event: SQSEvent): Promise<void> => {
  logger.started("batch", `Received ${event.Records.length} record(s)`);

  for (const record of event.Records) {
    const detail = parseRecord(record);

    if (!detail) {
      console.error("Failed to parse SQS record:", record.messageId);
      continue;
    }

    logger.started(detail.match_id, "Processing match", {
      tournament_id: detail.tournament_id,
      stage: detail.stage,
    });

    try {
      await backend.processMatch(detail.match_id, detail);
      logger.success(detail.match_id, "Match processed by backend", {
        tournament_id: detail.tournament_id,
        stage: detail.stage,
      });
    } catch (error) {
      if (error instanceof RetryExhaustedError) {
        logger.failed(
          detail.match_id,
          `All retries exhausted after ${error.attempts} attempts`,
          error.lastError,
          { tournament_id: detail.tournament_id }
        );
      } else {
        logger.failed(
          detail.match_id,
          "Failed to process match",
          error,
          { tournament_id: detail.tournament_id }
        );
      }
      throw error;
    }
  }
};
