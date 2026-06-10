import type { SQSEvent, SQSRecord } from "aws-lambda";
import { BackendClient } from "../../utils/backend-client.js";
import { createEventLogger } from "../../utils/logger.js";
import { RetryExhaustedError } from "../../utils/retry.js";
import type { CalculateInstanceRankingDetail } from "../../utils/types.js";

const BACKEND_URL = process.env.BACKEND_URL ?? "";
const M2M_SECRET_ARN = process.env.M2M_SECRET_ARN ?? "";

const logger = createEventLogger("CalculateRankingLambda");

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

  if (!BACKEND_URL) {
    logger.failed("batch", "BACKEND_URL not configured, cannot calculate ranking", null);
    return;
  }

  const backend = new BackendClient({ baseUrl: BACKEND_URL, m2mSecretArn: M2M_SECRET_ARN });

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
