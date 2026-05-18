import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';
import type { Team } from './Team';
import type { Match } from './Match';
import type { TournamentInstance } from './TournamentInstance';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({ type: 'varchar' })
  @IsString()
  name!: string;

  @Column({ type: 'varchar' })
  @IsString()
  token!: string;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  start_date!: string | null;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  end_date!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  @IsOptional()
  created_at!: Date;

  @IsOptional()
  @OneToMany('Match', 'tournament')
  matches!: Match[];

  @IsOptional()
  @OneToMany('Team', 'tournament')
  teams!: Team[];

  @IsOptional()
  @OneToMany('TournamentInstance', 'tournament')
  instances!: TournamentInstance[];
}
