import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TournamentTeam } from './TournamentTeam';
import { GroupTeam } from './GroupTeam';
import { Match } from './Match';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  shield_url: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleted_at: Date | null;

  @OneToMany(() => TournamentTeam, (tt) => tt.team)
  tournament_teams: TournamentTeam[];

  @OneToMany(() => GroupTeam, (gt) => gt.team)
  group_teams: GroupTeam[];

  @OneToMany(() => Match, (m) => m.home_team)
  home_matches: Match[];

  @OneToMany(() => Match, (m) => m.away_team)
  away_matches: Match[];
}
