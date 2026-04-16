import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import type { Tournament } from './Tournament';
import type { GroupTeam } from './GroupTeam';

@Entity('groups')
@Unique(['tournament_id', 'group_name'])
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournament_id!: string;

  @Column({ type: 'varchar' })
  group_name!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleted_at!: Date | null;

  @ManyToOne('Tournament', 'groups', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @OneToMany('GroupTeam', 'group')
  group_teams!: GroupTeam[];
}
