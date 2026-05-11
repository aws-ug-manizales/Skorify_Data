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
import type { Match } from './Match';
import { Tournament } from '../lib';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournament_id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  shield_url!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleted_at!: Date | null;

  @OneToMany('Match', 'home_team')
  home_matches!: Match[];

  @OneToMany('Match', 'away_team')
  away_matches!: Match[];

  @ManyToOne('Tournament', 'teams', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;
}
