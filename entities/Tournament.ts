import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import type { TournamentTeam } from './TournamentTeam';
import type { Group } from './Group';
import type { Match } from './Match';
import type { Payment } from './Payment';
import type { Leaderboard } from './Leaderboard';
import type { Instance } from './Instance';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'date', nullable: true })
  start_date!: string | null;

  @Column({ type: 'date', nullable: true })
  end_date!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @OneToMany('TournamentTeam', 'tournament')
  tournament_teams!: TournamentTeam[];

  @OneToMany('Group', 'tournament')
  groups!: Group[];

  @OneToMany('Match', 'tournament')
  matches!: Match[];

  @OneToMany('Payment', 'tournament')
  payments!: Payment[];

  @OneToMany('Leaderboard', 'tournament')
  leaderboard!: Leaderboard[];

  @OneToMany('Instance', 'tournament')
  instances!: Instance[];
}