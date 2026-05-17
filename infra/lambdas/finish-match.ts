import type { SQSEvent, SQSRecord } from "aws-lambda";

interface MatchFinishedDetail {
  match_id: string;
  tournament_id: string;
  final_home_goals: number;
  final_away_goals: number;
  stage: string;
}

function parseRecord(record: SQSRecord): MatchFinishedDetail | null {
  try {
    const body = JSON.parse(record.body);
    return body.detail as MatchFinishedDetail;
  } catch (err) {
    console.error("Failed to parse SQS record:", err);
    return null;
  }
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`FinishMatch received ${event.Records.length} record(s)`);

  for (const record of event.Records) {
    const detail = parseRecord(record);
    if (!detail) continue;

    console.log("Processing MatchFinished:", JSON.stringify(detail, null, 2));
  }
};
