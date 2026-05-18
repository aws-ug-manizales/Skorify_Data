import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { IsUUID, IsString, IsOptional, IsUrl } from 'class-validator';
import type { Match } from './Match';
import type { Tournament } from './Tournament';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  tournament_id!: string;

  @Column({ type: 'varchar' })
  @IsString()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsUrl()
  shield_url!: string | null;

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
  @OneToMany('Match', 'home_team')
  home_matches!: Match[];

  @IsOptional()
  @OneToMany('Match', 'away_team')
  away_matches!: Match[];

  @IsOptional()
  @ManyToOne('Tournament', 'teams', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;
}
