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
import type { Tournament } from './Tournament';
import type { User } from './User';
import type { InstanceUser } from './InstanceUser';
import type { InstanceRule } from './InstanceRule';

@Entity('instances')
export class Instance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournament_id!: string;

  @Column({ type: 'uuid' })
  owner_user_id!: string;

  @Column({ type: 'uuid', nullable: true })
  validator_user_id!: string | null;

  @Column({
    type: 'enum',
    enum: ['Aprobado', 'En Espera', 'Denegada'],
    default: 'En Espera',
  })
  state!: 'Aprobado' | 'En Espera' | 'Denegada';

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'int', default: 0 })
  price!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleted_at!: Date | null;

  @ManyToOne('Tournament', 'instances', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne('User', 'owned_instances', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  @ManyToOne('User', 'validated_instances', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'validator_user_id' })
  validator!: User | null;

  @OneToMany('InstanceUser', 'instance')
  instance_users!: InstanceUser[];

  @OneToMany('InstanceRule', 'instance')
  instance_rules!: InstanceRule[];
}
