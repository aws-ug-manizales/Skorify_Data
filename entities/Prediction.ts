import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import type { UserEnrollment } from "./UserEnrollment";
import type { Match } from "./Match";
import { User } from "./User";
import { TournamentInstance } from "./TournamentInstance";
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

@Entity("predictions")
@Unique(["user_enrollment_id", "match_id"])
export class Prediction {
  @PrimaryGeneratedColumn("uuid")
  @IsUUID()
  id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  user_id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  user_enrollment_id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  tournament_instance_id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  @IsString()
  match_id!: string;

  @Column({ type: "int" })
  @IsOptional()
  @IsNumber()
  home_score!: number;
  
  

  @Column({ type: "int" })
  @IsOptional()
  @IsNumber()
  away_score!: number;

  @Column({ type: "int", default: 0 })
  @IsNumber()
  earned_points!: number;

  @Column({ type: "boolean", default: false })
  @IsOptional()
  @IsBoolean()
  has_exact_result!: boolean;

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

  @ManyToOne("User", "predictions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  @IsOptional()
  user!: User;

  @ManyToOne("UserEnrollment", "predictions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_enrollment_id" })
  @IsOptional()
  user_enrollment!: UserEnrollment;

  @ManyToOne("TournamentInstance", "predictions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournament_instance_id" })
  @IsOptional()
  tournament_instance!: TournamentInstance;

  @ManyToOne("Match", "predictions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "match_id" })
  @IsOptional()
  match!: Match;
}
