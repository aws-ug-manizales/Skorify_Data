import type { SQSEvent, SQSRecord } from "aws-lambda";
import { initBackedClient } from "../../utils/backend-client.js";
import { createEventLogger } from "../../utils/logger.js";
import { RetryExhaustedError } from "../../utils/retry.js";
import type { CalculateInstanceRankingDetail } from "../../utils/types.js";

const logger = createEventLogger("CalculateRankingLambda");

const backend = initBackedClient(logger);

function parseRecord(record: SQSRecord): CalculateInstanceRankingDetail | null {
  try {
    const body = JSON.parse(record.body);

    if (body.detail) {
      return body.detail as CalculateInstanceRankingDetail;
    }

    return body as CalculateInstanceRankingDetail;
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

    logger.started(detail.instance_id, "Calculating tournament instance ranking", {
      match_id: detail.match_id,
      tournament_id: detail.tournament_id,
    });

    try {
      await backend.calculateTournamentInstanceRanking(detail.instance_id, detail);
      logger.success(detail.instance_id, "Tournament instance ranking calculated", {
        match_id: detail.match_id,
        tournament_id: detail.tournament_id,
      });
    } catch (error) {
      if (error instanceof RetryExhaustedError) {
        logger.failed(
          detail.instance_id,
          `All retries exhausted after ${error.attempts} attempts`,
          error.lastError,
          { match_id: detail.match_id, tournament_id: detail.tournament_id }
        );
      } else {
        logger.failed(
          detail.instance_id,
          "Failed to calculate tournament instance ranking",
          error,
          { match_id: detail.match_id, tournament_id: detail.tournament_id }
        );
      }
      throw error;
    }
  }
};
