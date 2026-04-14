import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Team } from './Team';
import { Tournament } from './Tournament';
import { Prediction } from './Prediction';

@Entity('matches')
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

  @ManyToOne(() => Team, (t) => t.home_matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'home_team_id' })
  home_team!: Team;

  @ManyToOne(() => Team, (t) => t.away_matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'away_team_id' })
  away_team!: Team;

  @ManyToOne(() => Tournament, (t) => t.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @OneToMany(() => Prediction, (p) => p.match)
  predictions!: Prediction[];
}
