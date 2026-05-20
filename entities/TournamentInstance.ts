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
import type { Tournament } from "./Tournament";
import type { User } from "./User";
import type { UserEnrollment } from "./UserEnrollment";

@Entity("tournament_instances")
export class TournamentInstance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "uuid" })
  owner_id!: string;

  @Column({ type: "uuid" })
  tournament_id!: string;

  @Column({
    type: "enum",
    enum: ["active", "inactive", "suspended", "terminated"],
    default: "active",
  })
  state!: "active" | "inactive" | "suspended" | "terminated";

  @Column({ type: "varchar" })
  invite_code!: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz", nullable: true, default: null })
  updated_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  deleted_at!: Date | null;

  @ManyToOne("Tournament", "tournament_instances", { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournament_id" })
  tournament!: Tournament;

  @ManyToOne("User", "owned_instances", { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @OneToMany("UserEnrollment", "tournament_instance")
  user_enrollments!: UserEnrollment[];
}
