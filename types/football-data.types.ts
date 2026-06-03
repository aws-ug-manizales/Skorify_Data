export type FootballDataTeam = {
    id: number;
    name: string;
    crest?: string;
}

export type FootballDataCompetition {
    id: number;
    name: string;
    code: string;
    startDate?: string;
    endDate?: string;
}


export type FootballDataMatch = {
    id: number;
    utcDate: string;
    status: string;
    stage: string;
    matchday: number;
    competition: FootballDataCompetition;
    homeTeam: FootballDataTeam;
    awayTeam: FootballDataTeam;
}
