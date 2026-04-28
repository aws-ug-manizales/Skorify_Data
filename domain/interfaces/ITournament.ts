export interface ITournament {
  id?: string;
  name: string;
  start_date: Date;
  end_date: Date;
  // Usamos un literal de string para asegurar que solo se usen estos 3 estados
  status: 'PLANNED' | 'ACTIVE' | 'FINISHED';
  created_at?: Date;
}