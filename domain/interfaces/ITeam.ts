export interface ITeam {
  id: string;
  name: string;
  code: string;
  shield_url: string | null;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}