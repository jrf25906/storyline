import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  Index
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Session } from './Session';
import { RefreshToken } from './RefreshToken';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  password: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string | null;

  @Column({ nullable: true })
  emailVerificationExpires: Date | null;

  @Column({ nullable: true })
  passwordResetToken: string | null;

  @Column({ nullable: true })
  passwordResetExpires: Date | null;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: ['email', 'google', 'apple', 'microsoft'], default: 'email' })
  provider: string;

  @Column({ nullable: true })
  providerId: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    notifications: {
      email: boolean;
      push: boolean;
      reminders: boolean;
    };
  };

  @Column({ nullable: true })
  twoFactorSecret: string;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ type: 'simple-array', nullable: true })
  backupCodes: string[];

  @Column({ default: 'free' })
  subscriptionPlan: string;

  @Column({ nullable: true })
  subscriptionExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ nullable: true })
  lockoutUntil: Date | null;

  @OneToMany(() => Session, session => session.user)
  sessions: Session[];

  @OneToMany(() => RefreshToken, token => token.user)
  refreshTokens: RefreshToken[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  isLocked(): boolean {
    return this.lockoutUntil && this.lockoutUntil > new Date();
  }

  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockoutUntil = null;
  }
}