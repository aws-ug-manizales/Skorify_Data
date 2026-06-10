import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { IsUUID, IsOptional, IsIn, IsInt, IsDate } from "class-validator";
import type { Team } from "./Team";
import type { Tournament } from "./Tournament";
import type { Prediction } from "./Prediction";

@Entity("matches")
export class Match {
  @PrimaryGeneratedColumn("uuid")
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  home_team_id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  away_team_id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  tournament_id!: string;

  @Column({ type: "timestamptz" })
  @IsOptional()
  kick_off?: Date;

  @Column({ type: "int", nullable: true })
  @IsOptional()
  @IsInt()
  home_score?: number | null;

  @Column({ type: "int", nullable: true })
  @IsOptional()
  @IsInt()
  away_score?: number | null;

  @Column({
    type: "enum",
    enum: ["scheduled", "in_progress", "finished", "draft", "calculated", "cancelled"],
    default: "scheduled",
  })
  @IsOptional()
  @IsIn(["scheduled", "in_progress", "finished", "draft", "calculated", "cancelled"])
  status?: "scheduled" | "in_progress" | "finished" | "draft" | "calculated" | "cancelled";

  @Column({
    type: "enum",
    enum: ["group", "finals"],
    default: "group",
  })
  @IsOptional()
  @IsIn(["group", "finals"])
  stage?: "group" | "finals";

  @Column({ type: "varchar" })
  @IsOptional()
  venue!: string;

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
  
  @ManyToOne("Team", "home_matches", { onDelete: "CASCADE" })
  @JoinColumn({ name: "home_team_id" })
  @IsOptional()
  home_team!: Team;

  @ManyToOne("Team", "away_matches", { onDelete: "CASCADE" })
  @IsOptional()
  @JoinColumn({ name: "away_team_id" })
  away_team!: Team;

  @ManyToOne("Tournament", "matches", { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournament_id" })
  @IsOptional()
  tournament!: Tournament;

  @OneToMany("Prediction", "match")
  @IsOptional()
  predictions!: Prediction[];
}
