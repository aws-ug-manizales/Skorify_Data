// src/entities/UserScore.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
@Unique(["user"])
export class UserScore {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.scores, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ default: 0 })
  correctPredictions: number;