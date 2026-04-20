import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Match } from "./Match";

@Entity()
@Unique(["user", "match"]) // un usuario solo predice una vez
export class Prediction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.predictions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Match, (m) => m.predictions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "matchId" })
  match: Match;

  @Column()
  homeScore: number;

  @Column()
  awayScore: number;

  @CreateDateColumn()
  createdAt: Date;
}