import { getMatchesByCompetition } from '../utils/footballDataClient';

export const handler = async (event: any): Promise<any> => {
    console.log("Received event:", JSON.stringify(event, null, 2));
    const competitionId = event.pathParameters?.competitionId;
    if (!competitionId) {
        console.error("No competition ID provided in path parameters.");
        throw new Error("Competition ID is required");
    }
    try {
        const matches = await getMatchesByCompetition(competitionId);
        console.log(`Fetched ${matches.length} matches for competition ID: ${competitionId}`);
        return {
            statusCode: 200,
            body: JSON.stringify(matches),
        };
    } catch (error) {
        console.error(`Error fetching matches for competition ID ${competitionId}:`, error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch matches" }),
        };
    }
};