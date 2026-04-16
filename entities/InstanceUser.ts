import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import type { User } from './User';
import type { Instance } from './Instance';
import type { Prediction } from './Prediction';

@Entity('instance_users')
@Unique(['player_id', 'instance_id'])
export class InstanceUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  player_id!: string;

  @Column({ type: 'uuid' })
  instance_id!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joined_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne('User', 'instance_users', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player!: User;

  @ManyToOne('Instance', 'instance_users', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance!: Instance;

  @OneToMany('Prediction', 'instance_player')
  predictions!: Prediction[];
}
