import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import type { Team } from "./Team";
import type { Match } from "./Match";
import type { TournamentInstance } from "./TournamentInstance";
import { IsDate, IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import { MatchType } from "@skorify/domain/tournament";

@Entity("tournaments")
export class Tournament {
  @PrimaryGeneratedColumn("uuid")
  @IsUUID()
  id!: string;

  @Column({ type: "varchar" })
  @IsOptional()
  @IsString()
  name!: string;

  @Column({
    type: "enum",
    enum: ["single_match_per_round", "home_and_away_per_round"],
    default: "group",
  })
  @IsOptional()
  @IsIn(["single_match_per_round", "home_and_away_per_round"])
  match_type!: MatchType;

  @Column({ type: "date", nullable: true })
  @IsDate()
  @IsOptional()
  start_date!: string | null;

  @Column({ type: "date", nullable: true })
  @IsDate()
  @IsOptional()
  end_date!: string | null;

  @Column({ type: "varchar" })
  @IsString()
  @IsOptional()
  token!: string;

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

  @OneToMany("Match", "tournament")
  @IsOptional()
  matches!: Match[];

  @OneToMany("Team", "tournament")
  @IsOptional()
  teams!: Team[];

  @OneToMany("TournamentInstance", "tournament")
  @IsOptional()
  instances!: TournamentInstance[];
}
