import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { TournamentInstance } from './TournamentInstance';
import { Prediction } from './Prediction';

@Entity('user_enrrollments')
@Unique(['player_id', 'tournament_instance_id'])
export class UserEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  player_id!: string;

  @Column({ type: 'uuid' })
  tournament_instance_id!: string;

  @Column({ type: 'int', nullable: true })
  last_position!: number | null;

  @Column({ type: 'int', nullable: true })
  current_position!: number | null;

  @Column({ type: 'int', default: 0 })
  current_score!: number;

  @Column({ type: 'int', default: 0 })
  exact_hits!: number;

  @Column({ type: 'int', default: 0 })
  streak!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @ManyToOne(() => User, (u) => u.user_enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: User;

  @ManyToOne(() => TournamentInstance, (t) => t.user_enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_instance_id' })
  tournament_instance!: TournamentInstance;

  @OneToMany('Prediction', 'user_enrollment')
  predictions!: Prediction[];
}
