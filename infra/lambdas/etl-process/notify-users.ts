import type { SQSEvent, SQSRecord } from "aws-lambda";

function parseRecord(record: SQSRecord) {
  try {
    const body = JSON.parse(record.body);
    return body.detail;
  } catch (err) {
    console.error("Failed to parse SQS record:", err);
    return null;
  }
}

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`NotifyUsers received ${event.Records.length} record(s)`);

  for (const record of event.Records) {
    const detail = parseRecord(record);
    if (!detail) continue;

    console.log("Processing NotifyUser:", JSON.stringify(detail, null, 2));
  }
};
