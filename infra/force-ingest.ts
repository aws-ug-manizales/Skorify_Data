import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";


const eventBridge = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "SkorifyDataBus";


const matchId = process.argv[2];

if (!matchId) {
  console.error("❌ Error: Debes proporcionar el ID del partido.");
  console.error("Ejemplo de uso: npx ts-node force-ingest.ts 123456");
  process.exit(1);
}

async function main() {
  console.log(`🚀 Iniciando ingesta forzada para el partido ID: ${matchId}`);

  // evento simulando un partido finalizado real
  const detail = {
    match_id: matchId,
    tournament_id: "c6b7c3d2-7b1a-4d2b-8c3a-9e4b5c6d7e8f", // cambiar por una id real
    final_home_goals: 2, // Marcador de prueba
    final_away_goals: 1,
    stage: "group",
    timestamp: new Date().toISOString(),
  };

  const command = new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: "SkorifyBackend", // Activador de Step Function 
        DetailType: "MatchFinished",
        Detail: JSON.stringify(detail),
      },
    ],
  });

  try {
    const result = await eventBridge.send(command);
    console.log("✅ Evento enviado exitosamente a EventBridge.");
    console.log("Detalle del evento enviado:", JSON.stringify(detail, null, 2));
    console.log("Resultado de AWS:", JSON.stringify(result, null, 2));
    console.log("\n👀 Revisa los logs de la Step Function en tu consola de AWS para ver el cálculo.");
  } catch (error) {
    console.error("❌ Error al enviar el evento a AWS:", error);
    process.exit(1);
  }
}

main();
