import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { TournamentInstance } from "./TournamentInstance";
import { Prediction } from "./Prediction";
import { IsDate, IsNumber, IsOptional, IsUUID } from "class-validator";

@Entity("user_enrollments")
@Unique(["user_id", "tournament_instance_id"])
export class UserEnrollment {
  @IsUUID()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  user_id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  tournament_instance_id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  tournament_id!: string;

  @Column({ type: "int", nullable: true })
  @IsNumber()
  @IsOptional()
  last_position!: number | null;

  @Column({ type: "int", nullable: true })
  @IsNumber()
  @IsOptional()
  current_position!: number | null;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @IsOptional()
  current_score!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @IsOptional()
  exact_hits!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @IsOptional()
  streak!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  @IsOptional()
  max_streak!: number;

  @CreateDateColumn({ type: "timestamptz" })
  @IsDate()
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz", nullable: true, default: null })
  @IsDate()
  @IsOptional()
  updated_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  @IsOptional()
  deleted_at!: Date | null;

  @UpdateDateColumn({ type: "timestamptz", nullable: true, default: null })
  @IsDate()
  @IsOptional()
  joined_at!: Date | null;

  @ManyToOne(() => User, (u) => u.user_enrollments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  @IsOptional()
  user!: User;

  @ManyToOne(() => TournamentInstance, (t) => t.user_enrollments, {
    onDelete: "CASCADE",
  })
  @IsOptional()
  @JoinColumn({ name: "tournament_instance_id" })
  tournament_instance!: TournamentInstance;

  @OneToMany("Prediction", "user_enrollment")
  @IsOptional()
  predictions!: Prediction[];
}
