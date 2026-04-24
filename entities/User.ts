import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Payment } from './Payment';
import { Leaderboard } from './Leaderboard';
import { Instance } from './Instance';
import { InstanceUser } from './InstanceUser';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  email!: string;

  @Column({ type: 'varchar', select: false }) // 'select: false' por seguridad, no trae el hash a menos que se pida explícitamente
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

  // Relaciones
  @OneToMany(() => Payment, (payment) => payment.user)
  payments!: Payment[];

  @OneToMany(() => Leaderboard, (leaderboard) => leaderboard.user)
  leaderboard!: Leaderboard[];

  @OneToMany(() => Instance, (instance) => instance.owner)
  owned_instances!: Instance[];

  @OneToMany(() => Instance, (instance) => instance.validator)
  validated_instances!: Instance[];

  @OneToMany(() => InstanceUser, (instanceUser) => instanceUser.player)
  instance_users!: InstanceUser[];
}