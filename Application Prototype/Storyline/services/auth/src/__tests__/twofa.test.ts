import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { AuthService } from '../services/AuthService';
import { User } from '../entities/User';
import { getRepository } from 'typeorm';

// Mock dependencies
jest.mock('typeorm');
jest.mock('../utils/logger');
jest.mock('../utils/email');
jest.mock('../config/redis');
jest.mock('qrcode');

describe('Two-Factor Authentication (2FA)', () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    
    (getRepository as jest.Mock).mockImplementation(() => mockUserRepository);
    authService = new AuthService();
  });

  describe('2FA Setup', () => {
    it('should generate 2FA secret and QR code', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        twoFactorSecret: null,
        save: jest.fn(),
      } as any; // Type assertion to bypass strict typing for mocks

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url: 'otpauth://totp/Storyline%20(test@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Storyline',
        ascii: 'ascii-secret',
        hex: 'hex-secret',
        google_auth_qr: 'google-auth-qr-url',
      };
      
      jest.spyOn(speakeasy, 'generateSecret').mockReturnValue(mockSecret);
      (qrcode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,mockQRCode');

      const result = await authService.setup2FA('user-123');

      expect(speakeasy.generateSecret).toHaveBeenCalledWith({
        name: 'Storyline (test@example.com)',
        issuer: 'Storyline',
      });

      expect(mockUser.twoFactorSecret).toBe('JBSWY3DPEHPK3PXP');
      expect(mockUser.save).toHaveBeenCalled();
      
      expect(qrcode.toDataURL).toHaveBeenCalledWith(mockSecret.otpauth_url);
      expect(result).toEqual({
        qrCode: 'data:image/png;base64,mockQRCode',
        secret: 'JBSWY3DPEHPK3PXP',
      });
    });

    it('should handle user not found error', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.setup2FA('non-existent-user'))
        .rejects.toThrow('User not found');
    });

    it('should generate unique secrets for each user', async () => {
      const user1 = { 
        id: 'user-1', 
        email: 'user1@example.com', 
        twoFactorSecret: null,
        save: jest.fn() 
      } as any;
      const user2 = { 
        id: 'user-2', 
        email: 'user2@example.com', 
        twoFactorSecret: null,
        save: jest.fn() 
      } as any;

      mockUserRepository.findOne
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      const secret1 = { base32: 'SECRET1', otpauth_url: 'url1', ascii: 'ascii1', hex: 'hex1', google_auth_qr: 'qr1' };
      const secret2 = { base32: 'SECRET2', otpauth_url: 'url2', ascii: 'ascii2', hex: 'hex2', google_auth_qr: 'qr2' };
      
      jest.spyOn(speakeasy, 'generateSecret')
        .mockReturnValueOnce(secret1)
        .mockReturnValueOnce(secret2);
      
      (qrcode.toDataURL as jest.Mock).mockResolvedValue('mock-qr');

      await authService.setup2FA('user-1');
      await authService.setup2FA('user-2');

      expect(user1.twoFactorSecret).toBe('SECRET1');
      expect(user2.twoFactorSecret).toBe('SECRET2');
      expect(user1.twoFactorSecret).not.toBe(user2.twoFactorSecret);
    });
  });

  describe('2FA Verification', () => {
    it('should verify valid 2FA token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorEnabled: true,
      } as any;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await authService.verify2FA('user-123', '123456');

      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: 'JBSWY3DPEHPK3PXP',
        encoding: 'base32',
        token: '123456',
        window: 2,
      });

      expect(result).toBe(true);
    });

    it('should reject invalid 2FA token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorEnabled: true,
      } as any;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      const result = await authService.verify2FA('user-123', '999999');

      expect(result).toBe(false);
    });

    it('should handle 2FA not enabled', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        twoFactorEnabled: false,
      } as any;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(authService.verify2FA('user-123', '123456'))
        .rejects.toThrow('Two-factor authentication is not enabled');
    });
  });

  describe('2FA Enable/Disable', () => {
    it('should enable 2FA after verification', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorEnabled: false,
        save: jest.fn(),
      } as any;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await authService.enable2FA('user-123', '123456');

      expect(mockUser.twoFactorEnabled).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should disable 2FA', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        twoFactorEnabled: true,
        save: jest.fn(),
      } as any;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.disable2FA('user-123');

      expect(mockUser.twoFactorEnabled).toBe(false);
      expect(mockUser.twoFactorSecret).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
