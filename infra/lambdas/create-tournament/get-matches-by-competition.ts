import { FootballDataMatch } from '../../../types/football-data.types';
import { getMatchesByCompetition } from '../../utils/footballDataClient';
import { createEventLogger } from '../../utils/logger';
import { DDBClient } from '../../utils/ddbClient';

import type { MapItem } from '../../utils/types';

const logger = createEventLogger("GetMatchesByCompetitionLambda");
const matchDdb = new DDBClient("MATCH_MAPPING_TABLE");

export const handler = async (event: any): Promise<any> => {
    const competitionId = event.pathParameters?.competitionId;
    logger.started(competitionId, "Fetching matches for competition", { event });
    if (!competitionId) {
        logger.failed(competitionId, "No competition ID provided in path parameters.", { event });
        throw new Error("Competition ID is required");
    }
    try {
        const { matches, competition } = await getMatchesByCompetition(competitionId);
        logger.info(competitionId, `Fetched ${matches.length} matches for competition ID: ${competitionId}`, { event });
        const matchesNoSynced = await getMatchesNoSynced(matches);
        return {
            statusCode: 200,
            matches: matchesNoSynced,
            competition: competition
        };
    } catch (error) {
        logger.failed(competitionId, `Error fetching matches for competition ID ${competitionId}:`, { event, error });
        return {
            statusCode: 500,
            matches: [],
            error: "Failed to fetch matches",
        };
    }
};

const getMatchesNoSynced = async (matches: FootballDataMatch[]): Promise<FootballDataMatch[]> => {
    const matchIds = matches.map(fdMatch => ({fdataId: fdMatch.id}));
    const matchIdMapped = await matchDdb.getItems(matchIds) as MapItem[];
    const idMap = matchIdMapped.reduce((acc, item) => {
        acc[item.fdataId] = item.postgresId;
        return acc;
    }, {} as Record<string, string>);
    return matches.filter(match => !idMap[match.id.toString()]);
};