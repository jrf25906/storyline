import { getRepository } from 'typeorm';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { Session } from '../entities/Session';
import { 
  LoginRequest, 
  SignupRequest, 
  AuthTokens,
  DeviceInfo 
} from '@storyline/shared-types';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { 
  incrementLoginAttempts, 
  resetLoginAttempts,
  blacklistToken 
} from '../config/redis';

export class AuthService {
  private userRepository = getRepository(User);
  private refreshTokenRepository = getRepository(RefreshToken);
  private sessionRepository = getRepository(Session);

  async signup(data: SignupRequest): Promise<{ user: User; tokens: AuthTokens }> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user
    const user = this.userRepository.create({
      ...data,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      preferences: {
        theme: 'system',
        fontSize: 'medium',
        notifications: {
          email: true,
          push: true,
          reminders: true
        }
      }
    });

    await this.userRepository.save(user);

    // Send verification email
    await this.sendVerificationEmail(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    logger.info(`New user signup: ${user.email}`);

    return { user, tokens };
  }

  async login(data: LoginRequest, deviceInfo: DeviceInfo): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user with password
    const user = await this.userRepository.findOne({ 
      where: { email: data.email },
      select: ['id', 'email', 'name', 'password', 'emailVerified', 'lockoutUntil', 'loginAttempts', 'twoFactorEnabled']
    });

    if (!user) {
      await incrementLoginAttempts(data.email);
      throw new Error('Invalid credentials');
    }

    // Check lockout
    if (user.isLocked()) {
      throw new Error('Account is locked. Please try again later.');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(data.password);
    if (!isValidPassword) {
      user.incrementLoginAttempts();
      await this.userRepository.save(user);
      await incrementLoginAttempts(data.email);
      throw new Error('Invalid credentials');
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Reset login attempts
    user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);
    await resetLoginAttempts(data.email);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.createSession(user, tokens.accessToken, deviceInfo);

    logger.info(`User login: ${user.email}`);

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, used: false },
      relations: ['user']
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Check if token family has been compromised
    if (tokenRecord.used) {
      // Revoke all tokens in the family
      await this.refreshTokenRepository.update(
        { family: tokenRecord.family },
        { revokedAt: new Date() }
      );
      throw new Error('Token reuse detected. All tokens revoked.');
    }

    // Mark current token as used
    tokenRecord.used = true;
    await this.refreshTokenRepository.save(tokenRecord);

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.user);

    // Create new refresh token in the same family
    const newRefreshToken = this.refreshTokenRepository.create({
      user: tokenRecord.user,
      token: tokens.refreshToken,
      family: tokenRecord.family,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      metadata: tokenRecord.metadata
    });

    await this.refreshTokenRepository.save(newRefreshToken);

    // Update the old token
    tokenRecord.replacedBy = newRefreshToken.id;
    await this.refreshTokenRepository.save(tokenRecord);

    return tokens;
  }

  async logout(token: string): Promise<void> {
    // Blacklist the access token
    const decoded = jwt.decode(token) as any;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await blacklistToken(token, ttl);

    // Revoke associated session
    await this.sessionRepository.update(
      { token },
      { isActive: false, revokedAt: new Date() }
    );

    logger.info(`User logged out`);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    user.passwordResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepository.save(user);

    // Send reset email
    await this.sendPasswordResetEmail(user);

    logger.info(`Password reset requested for: ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() } as any
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepository.save(user);

    logger.info(`Password reset for: ${user.email}`);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() } as any
      }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await this.userRepository.save(user);

    logger.info(`Email verified for: ${user.email}`);
  }

  async setup2FA(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `Storyline (${user.email})`,
      issuer: 'Storyline'
    });

    user.twoFactorSecret = secret.base32;
    await this.userRepository.save(user);

    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    return { qrCode, secret: secret.base32 };
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA not set up');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      user.twoFactorEnabled = true;
      await this.userRepository.save(user);
    }

    return verified;
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer'
    };
  }

  private async createSession(user: User, token: string, deviceInfo: DeviceInfo): Promise<Session> {
    const session = this.sessionRepository.create({
      user,
      token,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return this.sessionRepository.save(session);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify your Storyline account',
      html: `
        <h1>Welcome to Storyline!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `
    });
  }

  private async sendPasswordResetEmail(user: User): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${user.passwordResetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Reset your Storyline password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
  }
}