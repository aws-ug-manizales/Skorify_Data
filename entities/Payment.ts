import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User';
import { Tournament } from './Tournament';

@Entity('payments')
@Unique(['user_id', 'tournament_id'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  tournament_id: string;

  @Column({
    type: 'enum',
    enum: ['fallido', 'pendiente', 'pagado'],
    default: 'pendiente',
  })
  state_pay: 'fallido' | 'pendiente' | 'pagado';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: true, default: null })
  updated_at: Date | null;

  @ManyToOne(() => User, (u) => u.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tournament, (t) => t.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;
}
