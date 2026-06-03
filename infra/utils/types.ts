import type { RetryOptions } from "./retry.js";

// football data types

export interface FootballDataTeam {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
}

export interface FootballDataCompetition {
    id: number;
    name: string;
    code: string;
    currentSeason?: {
        startDate?: string;
        endDate?: string;
    };
}

// data team types

export interface MatchFinishedDetail {
  match_id: string;
  tournament_id: string;
  final_home_goals: number;
  final_away_goals: number;
  stage: string;
  timestamp: string;
}

export interface CalculateInstanceRankingDetail {
  match_id: string;
  tournament_id: string;
  instance_id: string;
}

export interface BackendClientConfig {
  baseUrl: string;
  retryOptions?: RetryOptions;
}

export type ProcessingStatus = "STARTED" | "RETRYING" | "SUCCESS" | "FAILED" | "INFO";

export interface EventLogEntry {
  match_id: string;
  instance_id?: string;
  status: ProcessingStatus;
  message: string;
  attempt?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}


export interface ParsedMatch {
    id: number;
    utcDate: string;
    status: string;
    matchday: number;
    tournament_id: string;
    homeTeam: FootballDataTeam;
    awayTeam: FootballDataTeam;
}

export interface HandlerInput {
    matches: ParsedMatch[];
    competition: FootballDataCompetition;
}


export type MapItem = {
    fdataId: string;
    postgresId: string;
    status?: string;
};

export type ExternalMap = Record<string, string>;

// backend client types

export interface BackendMatch {
  id?: string;
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  kick_off: string;
  home_goals: number;
  away_goals: number;
  status: string;
  stage: string;
  venue: string;
}

export type BackendTournament = {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  matchType: "SingleMatchPerRound";
};

export type BackendTeam = {
  id?: string;
  name: string;
  code: string;
  shieldUrl: string;
};
