export interface IMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  tournament_id: string;
  kick_off: Date;
  home_goals: number | null;
  away_goals: number | null;
  status: 'scheduled' | 'in_progress' | 'finished';
  stage: 'group' | 'finals';
  created_at: Date;
  updated_at: Date | null;
}