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
import {
  IsDate,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

@Entity("tournament_instances")
export class TournamentInstance {
  @IsUUID()
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  @IsString()
  name!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  owner_id!: string;

  @Column({ type: "uuid" })
  @IsOptional()
  tournament_id!: string;

  @Column({
    type: "enum",
    enum: ["active", "inactive", "suspended", "terminated"],
    default: "active",
  })
  @IsString()
  state!: "active" | "inactive" | "suspended" | "terminated";

  @Column({ type: "varchar" })
  @IsString()
  invite_code!: string;

  @CreateDateColumn({ type: "timestamptz" })
  @IsDate()
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz", nullable: true, default: null })
  @IsDate()
  @IsOptional()
  updated_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  @IsDate()
  @IsOptional()
  deleted_at!: Date | null;

  @ManyToOne("Tournament", "tournament_instances", { onDelete: "CASCADE" })
  @JoinColumn({ name: "tournament_id" })
  @IsOptional()
  tournament!: Tournament;

  @ManyToOne("User", "owned_instances", { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  @IsOptional()
  owner!: User;

  @OneToMany("UserEnrollment", "tournament_instance")
  @IsOptional()
  user_enrollments!: UserEnrollment[];
}
