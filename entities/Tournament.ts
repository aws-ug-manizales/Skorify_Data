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

@Entity("tournaments")
export class Tournament {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "date", nullable: true })
  start_date!: string | null;

  @Column({ type: "date", nullable: true })
  end_date!: string | null;

  @Column({ type: "varchar" })
  token!: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz", nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  deleted_at!: Date | null;

  @OneToMany("Match", "tournament")
  matches!: Match[];

  @OneToMany("Team", "tournament")
  teams!: Team[];

  @OneToMany("TournamentInstance", "tournament")
  instances!: TournamentInstance[];
}
