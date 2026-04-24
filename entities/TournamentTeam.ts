import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Team } from './Team';
import { Tournament } from './Tournament';

@Entity('tournament_teams')

@Unique(['team_id', 'tournament_id']) // Regla de negocio: Un equipo no puede estar dos veces en el mismo torneo
export class TournamentTeam {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  team_id!: string;

  @Column({ type: 'uuid' })
  tournament_id!: string;

  
  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Team, (team) => team.tournament_teams, { 
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE' 
  })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => Tournament, (tournament) => tournament.tournament_teams, { 
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;
}