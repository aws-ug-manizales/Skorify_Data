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
