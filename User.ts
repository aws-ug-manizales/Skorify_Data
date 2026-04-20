// src/entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { Prediction } from "./Prediction";
import { UserScore } from "./UserScore";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Prediction, (p) => p.user)
  predictions: Prediction[];

  @OneToMany(() => UserScore, (s) => s.user)
  scores: UserScore[];
}