import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Prediction } from './Prediction';
import type { Payment } from './Payment';
import type { Leaderboard } from './Leaderboard';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  password_hash!: string;

  @Column({ type: 'varchar', nullable: true })
  avatar_url!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleted_at!: Date | null;

  @OneToMany('Prediction', 'user')
  predictions!: Prediction[];

  @OneToMany('Payment', 'user')
  payments!: Payment[];

  @OneToMany('Leaderboard', 'user')
  leaderboard!: Leaderboard[];
}
