import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { IsUUID, IsString, IsEmail, IsOptional, IsIn, IsUrl } from 'class-validator';
import type { TournamentInstance } from './TournamentInstance';
import type { UserEnrollment } from './UserEnrollment';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({ type: 'varchar' })
  @IsString()
  name!: string;

  @Column({ type: 'varchar', unique: true })
  @IsEmail()
  email!: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsUrl()
  avatar_url!: string | null;

  @Column({
    type: 'enum',
    enum: ['general', 'admin'],
    default: 'general',
  })
  @IsOptional()
  @IsIn(['general', 'admin'])
  role!: 'general' | 'admin';

  @CreateDateColumn({ type: 'timestamptz' })
  @IsOptional()
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  @IsOptional()
  updated_at!: Date | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  @IsOptional()
  deleted_at!: Date | null;

  @IsOptional()
  @OneToMany('UserEnrollment', 'player')
  user_enrollments!: UserEnrollment[];

  @IsOptional()
  @OneToMany('TournamentInstance', 'owner')
  owned_instances!: TournamentInstance[];

  // @OneToMany('TournamentInstance', 'validator')
  // validated_instances!: TournamentInstance[];

}
