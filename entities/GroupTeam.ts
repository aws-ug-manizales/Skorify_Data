import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import type { Team } from './Team';
import type { Group } from './Group';

@Entity('group_teams')
@Unique(['team_id', 'group_id'])
export class GroupTeam {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  team_id!: string;

  @Column({ type: 'uuid' })
  group_id!: string;

  @ManyToOne('Team', 'group_teams', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne('Group', 'group_teams', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Group;
}
