export interface IUser {
  id?: string;
  name: string;
  email: string;
  role: 'general' | 'global' | 'instance';
  password_hash: string;
  avatar_url?: string | null;
  created_at?: Date;
  deleted_at?: Date | null;
}