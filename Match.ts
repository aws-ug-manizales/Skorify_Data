// src/entities/Match.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from "typeorm";
import { Prediction } from "./Prediction";

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  homeTeam: string;

  @Column()
  awayTeam: string;

  @Column({ type: "timestamptz" })
  matchDate: Date;

  @Column({ nullable: true })
  homeScore: number;

  @Column({ nullable: true })
  awayScore: number;

  @OneToMany(() => Prediction, (p) => p.match)
  predictions: Prediction[];
}