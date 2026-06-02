import { getMatchesByCompetition } from '../../utils/footballDataClient';
import { createEventLogger } from '../../utils/logger';

const logger = createEventLogger("GetMatchesByCompetitionLambda");

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
        return {
            statusCode: 200,
            matches: matches,
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