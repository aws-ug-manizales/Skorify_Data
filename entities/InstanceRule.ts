import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import type { Instance } from './Instance';
import type { Rule } from './Rule';

@Entity('instance_rules')
@Unique(['instance_id', 'rule_id'])
export class InstanceRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  instance_id!: string;

  @Column({ type: 'uuid' })
  rule_id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne('Instance', 'instance_rules', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instance_id' })
  instance!: Instance;

  @ManyToOne('Rule', 'instance_rules', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rule_id' })
  rule!: Rule;
}
