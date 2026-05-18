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
import { IsUUID, IsString, IsOptional, IsIn } from 'class-validator';
import type { Tournament } from './Tournament';
import type { User } from './User';
import type { UserEnrollment } from './UserEnrollment';

@Entity('tournament_instances')
export class TournamentInstance {
  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  tournament_id!: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  owner_user_id!: string;

  @Column({
    type: 'enum',
    enum: ['approved', 'pending', 'denied'],
    default: 'pending',
  })
  @IsOptional()
  @IsIn(['approved', 'pending', 'denied'])
  state!: 'approved' | 'pending' | 'denied';

  @Column({ type: 'varchar' })
  @IsString()
  name!: string;

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
  @ManyToOne('Tournament', 'tournament_instances', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @IsOptional()
  @ManyToOne('User', 'owned_instances', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  @IsOptional()
  @OneToMany('UserEnrollment', 'tournament_instance')
  user_enrollments!: UserEnrollment[];

}
