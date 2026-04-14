import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Team } from './Team';
import { Tournament } from './Tournament';

@Entity('tournament_teams')
@Unique(['team_id', 'tournament_id'])
export class TournamentTeam {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  team_id!: string;

  @Column({ type: 'uuid' })
  tournament_id!: string;

  @ManyToOne(() => Team, (t) => t.tournament_teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => Tournament, (t) => t.tournament_teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;
}
