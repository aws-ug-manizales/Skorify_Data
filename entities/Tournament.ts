import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Team } from './Team';
import type { Match } from './Match';
import type { TournamentInstance } from './TournamentInstance';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  token!: string;

  @Column({ type: 'date', nullable: true })
  start_date!: string | null;

  @Column({ type: 'date', nullable: true })
  end_date!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @OneToMany('Match', 'tournament')
  matches!: Match[];

  @OneToMany('Team', 'tournament')
  teams!: Team[];

  @OneToMany('TournamentInstance', 'tournament')
  instances!: TournamentInstance[];
}
