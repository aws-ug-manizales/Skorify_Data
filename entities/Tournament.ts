import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { TournamentTeam } from './TournamentTeam';
import { Group } from './Group';
import { Match } from './Match';
import { Payment } from './Payment';
import { Leaderboard } from './Leaderboard';

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

  @OneToMany(() => TournamentTeam, (tt) => tt.tournament)
  tournament_teams!: TournamentTeam[];

  @OneToMany(() => Group, (g) => g.tournament)
  groups!: Group[];

  @OneToMany(() => Match, (m) => m.tournament)
  matches!: Match[];

  @OneToMany(() => Payment, (p) => p.tournament)
  payments!: Payment[];

  @OneToMany(() => Leaderboard, (l) => l.tournament)
  leaderboard!: Leaderboard[];
}
