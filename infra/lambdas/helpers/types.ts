export interface MatchFinishedDetail {
  match_id: string;
  tournament_id: string;
  final_home_goals: number;
  final_away_goals: number;
  stage: string;
  timestamp: string;
}

export interface TournamentInstance {
  id: string;
  name: string;
  tournament_id: string;
  state: string;
}

export interface InstanceRankingResult {
  instance_id: string;
  rank: number;
  total_points: number;
  exact_hits: number;
  outcome_hits: number;
}

export interface GlobalRankingOutput {
  tournament_id: string;
  leaderboard: Array<{
    instance_id: string;
    position: number;
    total_points: number;
  }>;
  calculated_at: string;
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
