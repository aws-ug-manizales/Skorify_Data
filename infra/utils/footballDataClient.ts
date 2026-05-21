import { getRequest } from './httpClient';
import type { FootballDataMatch, FootballDataCompetition } from '../../types/football-data.types';

const BASE_URL = 'https://api.football-data.org/v4';

export const getMatchesByCompetition = async (competitionId: string): Promise<{ matches: FootballDataMatch[], competition: FootballDataCompetition }> => {
  // Simulate fetching matches from a data source based on the competition ID
  console.log(`Fetching matches for competition ID: ${competitionId}`);
  const matchesResponse = await getRequest(`${BASE_URL}/competitions/${competitionId}/matches?stage=GROUP_STAGE`);
  const matches = matchesResponse.matches || [];
  console.log(`Received matches data: ${JSON.stringify(matches)}`);
  const matchesParsed = parseMatches(matches);
  return { matches: matchesParsed, competition: matchesResponse.competition || {} };
};

const parseMatches = (matchesData: any[]): FootballDataMatch[] => {
  return matchesData.map(parseMatch);
};

const parseMatch = (matchData: any): FootballDataMatch => {
  return {
    id: matchData.id,
    utcDate: matchData.utcDate,
    status: matchData.status,
    competition: {
      id: matchData.competition?.id,
      name: matchData.competition?.name,
    },
    matchday: matchData.matchday,
    homeTeam: matchData.homeTeam,
    awayTeam: matchData.awayTeam,
  };
};