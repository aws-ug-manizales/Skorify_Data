import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Prediction } from './Prediction';
import { Payment } from './Payment';
import { Leaderboard } from './Leaderboard';

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

  @OneToMany(() => Prediction, (p) => p.user)
  predictions!: Prediction[];

  @OneToMany(() => Payment, (p) => p.user)
  payments!: Payment[];

  @OneToMany(() => Leaderboard, (l) => l.user)
  leaderboard!: Leaderboard[];
}
