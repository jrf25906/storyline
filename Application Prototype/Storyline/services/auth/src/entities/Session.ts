import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { User } from './User';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.sessions)
  user: User;

  @Column()
  @Index()
  token: string;

  @Column({ type: 'jsonb' })
  deviceInfo: {
    userAgent: string;
    ip: string;
    platform: string;
    browser?: string;
    os?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  lastActivityAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  revokedAt: Date;

  @Column({ nullable: true })
  revokedReason: string;
}