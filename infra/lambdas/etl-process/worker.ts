import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { getMatchesByCompetition } from '../../utils/footballDataClient';
import { DDBClient } from '../../utils/ddbClient';

import { DetailTypes, EventSources } from "../../lib/constants.js";

import type { MapItem, ExternalMap } from '../../utils/types';

const eventBridge = new EventBridgeClient();
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME ?? "SkorifyDataBus";

const matchDdb = new DDBClient("MATCH_MAPPING_TABLE");
const tournamentDdb = new DDBClient("TOURNAMENT_MAPPING_TABLE");

export const handler = async (): Promise<void> => {
    try {
        // Nota: "WC" es un ejemplo, es necesario poner la  ID de la competencia que tengan en la DB
        const { matches } = await getMatchesByCompetition("WC");

        const finishedMatches = matches.filter(m => m.status === 'FINISHED' || m.status === 'FT');

        console.log(`Se encontraron ${finishedMatches.length} partidos finalizados para procesar.`);

        if (finishedMatches.length === 0) {
            console.log("No se encontraron partidos finalizados para procesar.");
            return;
        }

        const { matchIds, tournamentIds } = mapExternalIds(finishedMatches);
        const { matchMap, tournamentMap } = await syncExternalIdsWithDB(matchIds, tournamentIds);


        const mappedMatches = finishedMatches
            .map(match => mapMatchToEventDetail(match, matchMap, tournamentMap))
            .filter(match => match.match_id !== null && match.tournament_id !== null);
        console.log("Partidos mapeados para eventos:", mappedMatches);

        await sendEvents(mappedMatches);
        console.log(`Evento publicado para los partidos ${matchIds.join(", ")}`);
    } catch (error) {
        console.error("Error en el Worker de ingesta:", error);
        throw error;
    }
};

const mapMatchToEventDetail = (match: any, matchMap: ExternalMap, tournamentMap: ExternalMap): any => {
    const matchMapId = matchMap[match.id.toString()];
    const tournamentMapId = tournamentMap[match.competition?.id.toString()];
    return {
        match_id: matchMapId ?? null,
        tournament_id: tournamentMapId ?? null,
        final_home_goals: match.score?.fullTime?.home ?? 0,
        final_away_goals: match.score?.fullTime?.away ?? 0,
        timestamp: new Date().toISOString()
    };
};

const mapExternalIds = (matches: any[]): { matchIds: string[], tournamentIds: string[] } => {
    return matches.reduce((acc, match) => {
        if (match.id && !acc.matchIds.includes(match.id.toString())) {
            acc.matchIds.push(match.id.toString());
        }
        if (match.competition?.id && !acc.tournamentIds.includes(match.competition.id.toString())) {
            acc.tournamentIds.push(match.competition.id.toString());
        }
        return acc;
    }, { matchIds: [], tournamentIds: [] });
};

const syncExternalIdsWithDB = async (matchIds: string[], tournamentIds: string[]): Promise<{ matchMap: ExternalMap, tournamentMap: ExternalMap }> => {
    const matchIdMapped = await matchDdb.getItems(matchIds.map(id => ({ fdataId: id }))) as MapItem[];
    const tournamentIdMapped = await tournamentDdb.getItems(tournamentIds.map(id => ({ fdataId: id }))) as MapItem[];
    return {
        matchMap: matchIdMapped.reduce((acc, item) => { acc[item.fdataId] = item.postgresId; return acc; }, {} as ExternalMap),
        tournamentMap: tournamentIdMapped.reduce((acc, item) => { acc[item.fdataId] = item.postgresId; return acc; }, {} as ExternalMap),
    }
};

const sendEvents = async (events: any[]): Promise<void> => {
    if (events.length === 0) {
        console.log("No se encontraron partidos con mapeo completo para procesar.");
        return;
    }
    while (events.length > 0) {
        const eventsChunk = events.splice(0, 10); // EventBridge tiene un límite de 10 eventos por batch
        const eventEntries = eventsChunk.map(match => {
            return {
                EventBusName: EVENT_BUS_NAME,
                Source: EventSources.SKORIFY_DATA,    // es el que esta en la configuracion de EventBridgeStack
                DetailType: DetailTypes.MATCH_FINISHED,
                Detail: JSON.stringify(match),
            };
        });
        const command = new PutEventsCommand({
            Entries: eventEntries
        });

        await eventBridge.send(command);
    }
};