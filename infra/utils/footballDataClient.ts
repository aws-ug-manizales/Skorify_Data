import { getRequest } from './httpClient';

const BASE_URL = 'https://api.football-data.org/v4';

export const getMatchesByCompetition = async (competitionId: string): Promise<any[]> => {
  // Simulate fetching matches from a data source based on the competition ID
  console.log(`Fetching matches for competition ID: ${competitionId}`);
  const matches = await getRequest(`${BASE_URL}/competitions/${competitionId}/matches`);
  const matchesParsed = parseMatches(matches);
  return matchesParsed;
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