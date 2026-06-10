import type { RetryOptions } from "./retry.js";

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
  m2mSecretArn: string;
  retryOptions?: RetryOptions;
}

export interface BackendMatch {
  id: string;
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

export type ProcessingStatus = "STARTED" | "RETRYING" | "SUCCESS" | "FAILED";

export interface EventLogEntry {
  match_id: string;
  instance_id?: string;
  status: ProcessingStatus;
  message: string;
  attempt?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
