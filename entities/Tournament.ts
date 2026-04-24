import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Check,
} from 'typeorm';
import type { TournamentTeam } from './TournamentTeam';
import type { Group } from './Group';
import type { Match } from './Match';
import type { Payment } from './Payment';
import type { Leaderboard } from './Leaderboard';
import type { Instance } from './Instance';

@Entity('tournaments')
@Check(`"end_date" >= "start_date"`)
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'date', nullable: false })
  start_date!: Date;  

  @Column({ type: 'date', nullable: false })
  end_date!: string;

  @Column({
    type: 'varchar',
    default: 'PLANNED',
  })

  @Column({
  type: 'enum',
  enum: ['PLANNED', 'ACTIVE', 'FINISHED'],
  default: 'PLANNED',
  })

  status!: 'PLANNED' | 'ACTIVE' | 'FINISHED'; // Regla de negocio: estados válidos

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
