import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { Payment } from './Payment';
import type { Leaderboard } from './Leaderboard';
import type { Instance } from './Instance';
import type { InstanceUser } from './InstanceUser';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  password_hash!: string;

  @Column({ type: 'varchar', nullable: true })
  avatar_url!: string | null;

  @Column({
    type: 'enum',
    enum: ['general', 'global', 'instance'],
    default: 'general',
  })
  role!: 'general' | 'global' | 'instance';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleted_at!: Date | null;

  @OneToMany('Payment', 'user')
  payments!: Payment[];

  @OneToMany('Leaderboard', 'user')
  leaderboard!: Leaderboard[];

  @OneToMany('Instance', 'owner')
  owned_instances!: Instance[];

  @OneToMany('Instance', 'validator')
  validated_instances!: Instance[];

  @OneToMany('InstanceUser', 'player')
  instance_users!: InstanceUser[];
}