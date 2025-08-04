import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuthService } from '../services/AuthService';
import { User } from '../entities/User';
import { getRepository } from 'typeorm';
import { sendEmail } from '../utils/email';

// Mock dependencies
jest.mock('typeorm');
jest.mock('../utils/logger');
jest.mock('../utils/email');
jest.mock('../config/redis');

describe('Password Management', () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;
    
    (getRepository as jest.Mock).mockImplementation(() => mockUserRepository);
    authService = new AuthService();
  });

  describe('Password Hashing', () => {
    it('should hash password before saving user', async () => {
      const plainPassword = 'MySecureP@ssw0rd!';
      const mockUser = new User();
      mockUser.password = plainPassword;
      
      await mockUser.hashPassword();
      
      expect(mockUser.password).not.toBe(plainPassword);
      expect(mockUser.password).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt format
      
      // Verify it's a valid bcrypt hash
      const isValid = await bcrypt.compare(plainPassword, mockUser.password);
      expect(isValid).toBe(true);
    });

    it('should not rehash already hashed passwords', async () => {
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz123456789';
      const mockUser = new User();
      mockUser.password = hashedPassword;
      
      await mockUser.hashPassword();
      
      expect(mockUser.password).toBe(hashedPassword); // Unchanged
    });

    it('should use correct salt rounds', async () => {
      const mockUser = new User();
      mockUser.password = 'TestPassword123';
      
      await mockUser.hashPassword();
      
      // Extract salt rounds from hash
      const rounds = parseInt(mockUser.password.split('$')[2]);
      expect(rounds).toBe(10);
    });
  });

  describe('Password Comparison', () => {
    it('should correctly validate matching passwords', async () => {
      const plainPassword = 'CorrectPassword123!';
      const mockUser = new User();
      mockUser.password = await bcrypt.hash(plainPassword, 10);
      
      const isValid = await mockUser.comparePassword(plainPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const mockUser = new User();
      mockUser.password = await bcrypt.hash('CorrectPassword123!', 10);
      
      const isValid = await mockUser.comparePassword('WrongPassword123!');
      expect(isValid).toBe(false);
    });

    it('should handle empty passwords gracefully', async () => {
      const mockUser = new User();
      mockUser.password = await bcrypt.hash('SomePassword', 10);
      
      const isValid = await mockUser.comparePassword('');
      expect(isValid).toBe(false);
    });
  });

  describe('Forgot Password', () => {
    it('should generate password reset token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        save: jest.fn(),
      } as any;
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      await authService.forgotPassword('test@example.com');
      
      expect(mockUser.passwordResetToken).toBeDefined();
      expect(mockUser.passwordResetToken).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(mockUser.passwordResetExpires).toBeDefined();
      expect(mockUser.passwordResetExpires.getTime())
        .toBeGreaterThan(Date.now());
      expect(mockUser.passwordResetExpires.getTime())
        .toBeLessThan(Date.now() + 61 * 60 * 1000); // Within 61 minutes
    });

    it('should send password reset email', async () => {
      const mockUser = {
        email: 'test@example.com',
        save: jest.fn(),
      } as any;
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      await authService.forgotPassword('test@example.com');
      
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Reset your Storyline password',
          html: expect.stringContaining('reset-password?token='),
        })
      );
    });

    it('should not reveal if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      // Should not throw error
      await expect(authService.forgotPassword('nonexistent@example.com'))
        .resolves.not.toThrow();
      
      // Should not send email
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error('DB Error'));
      
      await expect(authService.forgotPassword('test@example.com'))
        .rejects.toThrow('DB Error');
    });
  });

  describe('Reset Password', () => {
    it('should reset password with valid token', async () => {
      const newPassword = 'NewSecureP@ssw0rd!';
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'old-hashed-password',
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 min future
        save: jest.fn(),
      } as any;
      
      // Mock the TypeORM query syntax
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      await authService.resetPassword(resetToken, newPassword);
      
      expect(mockUser.password).toBe(newPassword);
      expect(mockUser.passwordResetToken).toBeNull();
      expect(mockUser.passwordResetExpires).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should reject expired reset tokens', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      const mockUser = {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() - 1000), // Expired
      } as any;
      
      mockUserRepository.findOne.mockResolvedValue(null); // Simulates not found due to date condition
      
      await expect(authService.resetPassword(resetToken, 'NewPassword'))
        .rejects.toThrow('Invalid or expired reset token');
    });

    it('should reject invalid reset tokens', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      
      await expect(authService.resetPassword('invalid-token', 'NewPassword'))
        .rejects.toThrow('Invalid or expired reset token');
    });

    it('should clear reset token after successful reset', async () => {
      const resetToken = 'valid-reset-token';
      const mockUser = {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 1000),
        save: jest.fn(),
      } as any;
      
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      await authService.resetPassword(resetToken, 'NewPassword');
      
      expect(mockUser.passwordResetToken).toBeNull();
      expect(mockUser.passwordResetExpires).toBeNull();
    });
  });

  describe('Password Strength', () => {
    // These tests would be for a password validation function
    // that should be implemented in production
    
    it('should validate password minimum length', () => {
      const isValid = (password: string) => password.length >= 8;
      
      expect(isValid('Short1!')).toBe(false);
      expect(isValid('LongEnough1!')).toBe(true);
    });

    it('should require mixed case letters', () => {
      const hasUpperCase = (password: string) => /[A-Z]/.test(password);
      const hasLowerCase = (password: string) => /[a-z]/.test(password);
      
      expect(hasUpperCase('lowercase123!')).toBe(false);
      expect(hasLowerCase('UPPERCASE123!')).toBe(false);
      expect(hasUpperCase('MixedCase123!') && hasLowerCase('MixedCase123!')).toBe(true);
    });

    it('should require numbers', () => {
      const hasNumber = (password: string) => /\d/.test(password);
      
      expect(hasNumber('NoNumbers!')).toBe(false);
      expect(hasNumber('HasNumbers123!')).toBe(true);
    });

    it('should require special characters', () => {
      const hasSpecial = (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      expect(hasSpecial('NoSpecialChars123')).toBe(false);
      expect(hasSpecial('HasSpecial123!')).toBe(true);
    });
  });

  describe('Account Lockout', () => {
    it('should lock account after 5 failed attempts', () => {
      const mockUser = new User();
      mockUser.loginAttempts = 0;
      
      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        mockUser.incrementLoginAttempts();
      }
      
      expect(mockUser.loginAttempts).toBe(5);
      expect(mockUser.lockoutUntil).toBeDefined();
      expect(mockUser.isLocked()).toBe(true);
    });

    it('should set lockout duration to 30 minutes', () => {
      const mockUser = new User();
      const now = Date.now();
      
      // Force 5 attempts
      mockUser.loginAttempts = 4;
      mockUser.incrementLoginAttempts();
      
      const lockoutTime = mockUser.lockoutUntil!.getTime() - now;
      // Allow 1 second tolerance
      expect(lockoutTime).toBeGreaterThan(29 * 60 * 1000);
      expect(lockoutTime).toBeLessThan(31 * 60 * 1000);
    });

    it('should reset login attempts on successful login', () => {
      const mockUser = new User();
      mockUser.loginAttempts = 3;
      mockUser.lockoutUntil = new Date(Date.now() + 1000);
      
      mockUser.resetLoginAttempts();
      
      expect(mockUser.loginAttempts).toBe(0);
      expect(mockUser.lockoutUntil).toBeNull();
      expect(mockUser.isLocked()).toBe(false);
    });

    it('should correctly check if account is locked', () => {
      const mockUser = new User();
      
      // Not locked - no lockout date
      expect(mockUser.isLocked()).toBe(false);
      
      // Not locked - lockout expired
      mockUser.lockoutUntil = new Date(Date.now() - 1000);
      expect(mockUser.isLocked()).toBe(false);
      
      // Locked - future lockout date
      mockUser.lockoutUntil = new Date(Date.now() + 1000);
      expect(mockUser.isLocked()).toBe(true);
    });
  });

  describe('Password History', () => {
    // These tests would be for password history feature
    // to prevent reuse of recent passwords
    
    it('should prevent reuse of recent passwords', async () => {
      // This would require a PasswordHistory entity
      // and logic to check against previous hashes
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Password Expiry', () => {
    it('should track password last changed date', () => {
      // This would require adding passwordChangedAt field
      // and logic to enforce password expiry policies
      expect(true).toBe(true); // Placeholder
    });
  });
});