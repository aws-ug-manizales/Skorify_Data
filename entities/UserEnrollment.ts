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
import { IsUUID, IsInt, IsOptional, Min } from 'class-validator';
import { User } from './User';
import { TournamentInstance } from './TournamentInstance';
import { Prediction } from './Prediction';

@Entity('user_enrollments')
@Unique(['player_id', 'tournament_instance_id'])
export class UserEnrollment {
  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  player_id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  tournament_instance_id!: string;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsInt()
  last_position!: number | null;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsInt()
  current_position!: number | null;

  @Column({ type: 'int', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  current_score!: number;

  @Column({ type: 'int', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  exact_hits!: number;

  @Column({ type: 'int', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  streak!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  @IsOptional()
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  @IsOptional()
  updated_at!: Date | null;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  @IsOptional()
  joined_at!: Date | null;

  @IsOptional()
  @ManyToOne(() => User, (u) => u.user_enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: User;

  @IsOptional()
  @ManyToOne(() => TournamentInstance, (t) => t.user_enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_instance_id' })
  tournament_instance!: TournamentInstance;

  @IsOptional()
  @OneToMany('Prediction', 'user_enrollment')
  predictions!: Prediction[];
}
