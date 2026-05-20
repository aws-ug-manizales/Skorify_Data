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

@Entity("predictions")
@Unique(["user_enrollment_id", "match_id"])
export class Prediction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  user_id!: string;

  @Column({ type: "uuid" })
  user_enrollment_id!: string;

  @Column({ type: "uuid" })
  tournament_instance_id!: string;

  @Column({ type: "uuid" })
  match_id!: string;

  @Column({ type: "int" })
  home_score!: number;

  @Column({ type: "int" })
  away_score!: number;

  @Column({ type: "int", default: 0 })
  earned_points!: number;

  @Column({ type: "boolean", default: false })
  has_exact_result!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz", nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  deleted_at!: Date | null;

  @ManyToOne("User", "predictions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
 
  @ManyToOne("UserEnrollment", "predictions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_enrollment_id" })
  user_enrollment!: UserEnrollment;

  @ManyToOne("TournamentInstance", "predictions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournament_instance_id" })
  tournament_instance!: TournamentInstance;

  @ManyToOne("Match", "predictions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "match_id" })
  match!: Match;
}
