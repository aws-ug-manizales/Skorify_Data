import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { IsUUID, IsOptional, IsIn, IsInt } from 'class-validator';
import type { Team } from './Team';
import type { Tournament } from './Tournament';
import type { Prediction } from './Prediction';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  home_team_id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  away_team_id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  tournament_id!: string;

  @Column({ type: 'timestamptz' })
  @IsOptional()
  kick_off?: Date;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsInt()
  home_goals?: number | null;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsInt()
  away_goals?: number | null;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'finished','draft'],
    default: 'scheduled',
  })
  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'finished','draft'])
  status?: 'scheduled' | 'in_progress' | 'finished' | 'draft';

  @Column({
    type: 'enum',
    enum: ['group', 'finals'],
    default: 'group',
  })
  @IsOptional()
  @IsIn(['group', 'finals'])
  stage?: 'group' | 'finals';

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  venue?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  @IsOptional()
  created_at?: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  @IsOptional()
  updated_at?: Date | null;

}
