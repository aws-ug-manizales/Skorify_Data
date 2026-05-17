import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User';
import { Instance } from '.';

@Entity('leaderboard')
@Unique(['user_id', 'instance_id'])
export class Leaderboard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  instance_id!: string;

  @Column({ type: 'int', nullable: true })
  position!: number | null;

  @Column({ type: 'int', default: 0 })
  total_points!: number;

  @Column({ type: 'int', default: 0 })
  exact_hits!: number;

  @Column({ type: 'int', default: 0 })
  outcome_hits!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @ManyToOne(() => User, (u) => u.leaderboard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Instance, (t) => t.leaderboard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance!: Instance;
}
