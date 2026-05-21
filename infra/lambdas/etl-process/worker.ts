import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { getMatchesByCompetition } from '../../utils/footballDataClient';

const eventBridge = new EventBridgeClient();
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME ?? "SkorifyDataBus";

export const handler = async (): Promise<void> => {
    try {
        
        // Nota: "WC" es un ejemplo, es necesario poner la  ID de la competencia que tengan en la DB
        const matches = await getMatchesByCompetition("WC"); 
        
        
        const finishedMatches = matches.filter(m => m.status === 'FINISHED' || m.status === 'FT');

        if (finishedMatches.length === 0) {
            console.log("No se encontraron partidos finalizados para procesar.");
            return;
        }

        for (const match of finishedMatches) {
            const detail = {
                match_id: match.id.toString(),
                tournament_id: "ID_DEL_TORNEO_ACTUAL", // --> no se si las id de DB ya estan pero esta es un ejemplo
                final_home_goals: match.score?.fullTime?.home ?? 0,
                final_away_goals: match.score?.fullTime?.away ?? 0,
                timestamp: new Date().toISOString()
            };

            
            const command = new PutEventsCommand({
                Entries: [{
                    EventBusName: EVENT_BUS_NAME,
                    Source: "SkorifyBackend",    // es el que esta en la configuracion de EventBridgeStack
                    DetailType: "MatchFinished",
                    Detail: JSON.stringify(detail),
                }]
            });

            await eventBridge.send(command);
            console.log(`Evento publicado para el partido ${match.id}`);
        }
    } catch (error) {
        console.error("Error en el Worker de ingesta:", error);
        throw error;
    }
};