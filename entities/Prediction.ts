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
import { IsUUID, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';
import type { UserEnrollment } from './UserEnrollment';
import type { Match } from './Match';

@Entity('predictions')
@Unique(['user_enrollment_id', 'match_id'])
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  user_enrollment_id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  match_id!: string;

  @Column({ type: 'int' })
  @IsInt()
  @Min(0)
  pred_home_goals!: number;

  @Column({ type: 'int' })
  @IsInt()
  @Min(0)
  pred_away_goals!: number;

  @Column({ type: 'int', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  earned_points!: number;

  @Column({ type: 'boolean', default: false })
  @IsOptional()
  @IsBoolean()
  has_exact_result!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  @IsOptional()
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  @IsOptional()
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  @IsOptional()
  deleted_at!: Date | null;

  @IsOptional()
  @ManyToOne('UserEnrollment', 'predictions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_enrollment_id' })
  user_enrollment!: UserEnrollment;

  @IsOptional()
  @ManyToOne('Match', 'predictions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;
}
