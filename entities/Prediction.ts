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
import type { InstanceUser } from './InstanceUser';
import type { Match } from './Match';

@Entity('predictions')
@Unique(['instance_player_id', 'match_id'])
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  instance_player_id!: string;

  @Column({ type: 'uuid' })
  match_id!: string;

  @Column({ type: 'int' })
  pred_home_goals!: number;

  @Column({ type: 'int' })
  pred_away_goals!: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  is_exact_hit!: boolean;

  @Column({ type: 'int', default: 0 })
  earned_points!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleted_at!: Date | null;

  @ManyToOne('InstanceUser', 'predictions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_player_id' })
  instance_player!: InstanceUser;

  @ManyToOne('Match', 'predictions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;
}
