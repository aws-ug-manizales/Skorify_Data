export interface IPrediction {
  id: string;
  instance_player_id: string;
  match_id: string;
  pred_home_goals: number;
  pred_away_goals: number;
  earned_points: number;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}