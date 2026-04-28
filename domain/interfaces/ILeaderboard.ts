export interface ILeaderboard {
  id: string;
  user_id: string;
  tournament_id: string;
  position: number | null;
  total_points: number;
  exact_hits: number;
  outcome_hits: number;
  created_at: Date;
  updated_at: Date | null;
}