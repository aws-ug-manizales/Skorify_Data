import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import type { Match } from "./Match";
import type { Tournament } from "./Tournament";
import { IsDate, IsOptional, IsString, IsUUID } from "class-validator";

@Entity("teams")
export class Team {
  @PrimaryGeneratedColumn("uuid")
  @IsUUID()
  id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  tournament_id!: string;

  @Column({ type: "varchar" })
  @IsString()
  name!: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  shield_url!: string | null;

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

  @OneToMany("Match", "home_team")
  @IsOptional()
  home_matches!: Match[];

  @OneToMany("Match", "away_team")
  @IsOptional()
  away_matches!: Match[];

  @ManyToOne("Tournament", "teams", { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournament_id" })
  @IsOptional()
  tournament!: Tournament;
}
