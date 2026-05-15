import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const eventBridge = new EventBridgeClient();
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME ?? "SkorifyDataBus";

function generateMatchDetail() {
  return {
    match_id: crypto.randomUUID(),
    tournament_id: crypto.randomUUID(),
    final_home_goals: Math.floor(Math.random() * 5),
    final_away_goals: Math.floor(Math.random() * 4),
    stage: Math.random() > 0.5 ? "group" : "finals",
    timestamp: new Date().toISOString(),
  };
}

export const handler = async (): Promise<void> => {
  const detail = generateMatchDetail();

  const command = new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: "SkorifyData",
        DetailType: "MatchFinished",
        Detail: JSON.stringify(detail),
      },
      {
        EventBusName: EVENT_BUS_NAME,
        Source: "SkorifyBackend",
        DetailType: "MatchFinished",
        Detail: JSON.stringify(detail),
      },
    ],
  });

  const result = await eventBridge.send(command);

  console.log("Worker published 2 MatchFinished events with shared detail:", JSON.stringify(detail, null, 2));
  console.log("  -> SkorifyData  -> SQS -> FinishMatch");
  console.log("  -> SkorifyBackend -> Step Functions -> Ranking");
  console.log("PutEvents result:", JSON.stringify(result));
};
