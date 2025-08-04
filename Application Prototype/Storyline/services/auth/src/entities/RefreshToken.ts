import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { User } from './User';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.refreshTokens)
  user: User;

  @Column()
  @Index()
  token: string;

  @Column()
  @Index()
  family: string; // Token family for rotation

  @Column({ default: false })
  used: boolean;

  @Column({ nullable: true })
  replacedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  revokedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    deviceId?: string;
    deviceName?: string;
    location?: string;
  };
}