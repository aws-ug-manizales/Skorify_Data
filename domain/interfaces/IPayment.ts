export interface IPayment {
  id: string;
  user_id: string;
  tournament_id: string;
  state_pay: 'failed' | 'pending' | 'paid';
  created_at: Date;
  updated_at: Date | null;
}