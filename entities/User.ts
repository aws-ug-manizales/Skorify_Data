import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import type { TournamentInstance } from './TournamentInstance';
import type { UserEnrollment } from './UserEnrollment';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  avatar_url!: string | null;

  @Column({
    type: 'enum',
    enum: ['general', 'admin'],
    default: 'general',
  })
  role!: 'general' | 'admin';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  deleted_at!: Date | null;

  @OneToMany('UserEnrollment', 'player')
  user_enrollments!: UserEnrollment[];

  @OneToMany('TournamentInstance', 'owner')
  owned_instances!: TournamentInstance[];

  // @OneToMany('TournamentInstance', 'validator')
  // validated_instances!: TournamentInstance[];

}
