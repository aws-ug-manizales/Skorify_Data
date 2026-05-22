import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import type { TournamentInstance } from "./TournamentInstance";
import type { UserEnrollment } from "./UserEnrollment";
import { IsDate, IsOptional, IsUUID } from "class-validator";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  @IsUUID()
  id!: string;

  @Column({ type: "varchar" })
  @IsOptional()
  name!: string;

  @Column({ type: "boolean", default: true })
  @IsOptional()
  is_active!: boolean;

  @Column({ type: "varchar" })
  @IsOptional()
  notification_token!: string;

  @Column({ type: "varchar", unique: true })
  @IsOptional()
  email!: string;

  @Column({ type: "varchar", nullable: true })
  @IsOptional()
  image!: string | null;
  
  @Column({
    type: "enum",
    enum: ["general", "admin"],
    default: "general",
  })
  @IsOptional()
  role!: "general" | "admin";

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
  
  @OneToMany("UserEnrollment", "player")
  @IsOptional()
  user_enrollments!: UserEnrollment[];
  
  @OneToMany("TournamentInstance", "owner")
  @IsOptional()
  owned_instances!: TournamentInstance[];

  // @OneToMany('TournamentInstance', 'validator')
  // validated_instances!: TournamentInstance[];
}
