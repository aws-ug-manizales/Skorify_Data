export interface IGroup {
  id: string;
  tournament_id: string;
  group_name: string;
  created_at: Date; 
  updated_at: Date | null;
  deleted_at: Date | null;
}