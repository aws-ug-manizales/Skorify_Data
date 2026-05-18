import { getRequest } from './httpClient';

const BASE_URL = 'https://api.football-data.org/v4';

export const getMatchesByCompetition = async (competitionId: string): Promise<{ matches: any[], competition: any }> => {
  // Simulate fetching matches from a data source based on the competition ID
  console.log(`Fetching matches for competition ID: ${competitionId}`);
  const matchesResponse = await getRequest(`${BASE_URL}/competitions/${competitionId}/matches?stage=FINAL`);
  const matches = matchesResponse.matches || [];
  console.log(`Received matches data: ${JSON.stringify(matches)}`);
  const matchesParsed = parseMatches(matches);
  return { matches: matchesParsed, competition: matchesResponse.competition || {} };
};

const parseMatches = (matchesData: any[]): any[] => {
  return matchesData.map(parseMatch);
};

const parseMatch = (matchData: any): any => {
  return {
    id: matchData.id,
    utcDate: matchData.utcDate,
    status: matchData.status,
    matchday: matchData.matchday,
    homeTeam: matchData.homeTeam,
    awayTeam: matchData.awayTeam,
  };
};