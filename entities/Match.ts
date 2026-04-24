import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Check,
} from 'typeorm';
import type { Team } from './Team';
import type { Tournament } from './Tournament';
import type { Prediction } from './Prediction';

@Entity('matches')
@Check(`"home_team_id" <> "away_team_id"`) 
@Check(`"home_goals" >= 0 AND "away_goals" >= 0`)
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  home_team_id!: string;

  @Column({ type: 'uuid' })
  away_team_id!: string;

  @Column({ type: 'uuid' })
  tournament_id!: string;

  @Column({ type: 'timestamptz' })
  kick_off!: Date;

  @Column({ type: 'int', nullable: true })
  home_goals!: number | null;

  @Column({ type: 'int', nullable: true })
  away_goals!: number | null;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'finished'],
    default: 'scheduled',
  })
  status!: 'scheduled' | 'in_progress' | 'finished';

  @Column({
    type: 'enum',
    enum: ['group', 'finals'],
    default: 'group',
  })
  stage!: 'group' | 'finals';

  @Column({ type: 'varchar', nullable: true })
  venue!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @ManyToOne('Team', 'home_matches', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'home_team_id' })
  home_team!: Team;

  @ManyToOne('Team', 'away_matches', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'away_team_id' })
  away_team!: Team;

  @ManyToOne('Tournament', 'matches', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @OneToMany('Prediction', 'match')
  predictions!: Prediction[];
}
