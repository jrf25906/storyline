import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthService } from '../services/AuthService';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { getRepository } from 'typeorm';

// Mock dependencies
jest.mock('typeorm');
jest.mock('../utils/logger');
jest.mock('../utils/email');
jest.mock('../config/redis');

describe('JWT Token Management', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockRefreshTokenRepository: any;
  let mockSessionRepository: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock repositories
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    
    mockRefreshTokenRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    
    mockSessionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    // Mock getRepository
    (getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === RefreshToken) return mockRefreshTokenRepository;
      return mockSessionRepository;
    });

    authService = new AuthService();
  });

  describe('generateTokens', () => {
    it('should generate valid access and refresh tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      } as User;

      // Access private method via any type casting
      const tokens = await (authService as any).generateTokens(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn', 900);
      expect(tokens).toHaveProperty('tokenType', 'Bearer');
      
      // Verify JWT structure
      expect(tokens.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/);
      
      // Verify JWT payload
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.name).toBe(mockUser.name);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should generate unique refresh tokens', async () => {
      const mockUser = { id: 'user-123' } as User;
      
      const tokens1 = await (authService as any).generateTokens(mockUser);
      const tokens2 = await (authService as any).generateTokens(mockUser);
      
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    it('should set correct expiration time', async () => {
      const mockUser = { id: 'user-123' } as User;
      const now = Math.floor(Date.now() / 1000);
      
      const tokens = await (authService as any).generateTokens(mockUser);
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET!) as any;
      
      // Should expire in approximately 15 minutes (900 seconds)
      expect(decoded.exp - decoded.iat).toBe(900);
      expect(decoded.iat).toBeCloseTo(now, -1);
    });
  });

  describe('refreshTokens', () => {
    it('should successfully refresh valid tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      } as User;

      const mockTokenRecord = {
        id: 'token-123',
        user: mockUser,
        token: 'valid-refresh-token',
        family: 'family-123',
        used: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        metadata: { device: 'iPhone' },
        save: jest.fn(),
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockTokenRecord);
      mockRefreshTokenRepository.create.mockImplementation((data: Partial<RefreshToken>) => ({ ...data, id: 'new-token-id' }));
      mockRefreshTokenRepository.save.mockImplementation((token: RefreshToken) => Promise.resolve(token));

      const newTokens = await authService.refreshTokens('valid-refresh-token');

      expect(newTokens).toHaveProperty('accessToken');
      expect(newTokens).toHaveProperty('refreshToken');
      expect((mockTokenRecord as any).used).toBe(true);
      expect((mockTokenRecord as any).replacedBy).toBe('new-token-id');
      expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          family: 'family-123',
          metadata: { device: 'iPhone' },
        })
      );
    });

    it('should reject expired refresh tokens', async () => {
      const mockTokenRecord = {
        token: 'expired-token',
        used: false,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockTokenRecord);

      await expect(authService.refreshTokens('expired-token'))
        .rejects.toThrow('Invalid or expired refresh token');
    });

    it('should reject non-existent refresh tokens', async () => {
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(authService.refreshTokens('non-existent-token'))
        .rejects.toThrow('Invalid or expired refresh token');
    });

    it('should detect and handle token reuse attacks', async () => {
      const mockTokenRecord = {
        token: 'reused-token',
        used: true, // Already used
        family: 'family-123',
        expiresAt: new Date(Date.now() + 1000),
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockTokenRecord);

      await expect(authService.refreshTokens('reused-token'))
        .rejects.toThrow('Token reuse detected. All tokens revoked.');

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { family: 'family-123' },
        { revokedAt: expect.any(Date) }
      );
    });

    it('should maintain token family lineage', async () => {
      const mockUser = { id: 'user-123' } as User;
      const familyId = 'family-456';
      
      const mockTokenRecord = {
        id: 'old-token',
        user: mockUser,
        token: 'current-refresh-token',
        family: familyId,
        used: false,
        expiresAt: new Date(Date.now() + 1000),
        save: jest.fn(),
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockTokenRecord);
      mockRefreshTokenRepository.create.mockImplementation((data: Partial<RefreshToken>) => ({ 
        ...data, 
        id: 'new-token-id',
        save: jest.fn().mockResolvedValue(data) 
      }));

      await authService.refreshTokens('current-refresh-token');

      expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          family: familyId, // Same family
          user: mockUser,
        })
      );
    });
  });

  describe('Token Security', () => {
    it('should not expose sensitive information in JWT', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password', // Should not be in token
        twoFactorSecret: 'secret-key', // Should not be in token
      } as any;

      const tokens = await (authService as any).generateTokens(mockUser);
      const decoded = jwt.decode(tokens.accessToken) as any;

      expect(decoded.password).toBeUndefined();
      expect(decoded.twoFactorSecret).toBeUndefined();
      expect(Object.keys(decoded)).toEqual(
        expect.arrayContaining(['id', 'email', 'name', 'iat', 'exp'])
      );
    });

    it('should generate cryptographically secure refresh tokens', async () => {
      const mockUser = { id: 'user-123' } as User;
      
      // Mock crypto.randomBytes to verify it's called correctly
      const originalRandomBytes = crypto.randomBytes;
      const mockRandomBytes = jest.fn().mockReturnValue(Buffer.from('a'.repeat(40)));
      crypto.randomBytes = mockRandomBytes as any;

      const tokens = await (authService as any).generateTokens(mockUser);

      expect(mockRandomBytes).toHaveBeenCalledWith(40);
      expect(tokens.refreshToken).toHaveLength(80); // 40 bytes = 80 hex chars

      // Restore original
      crypto.randomBytes = originalRandomBytes;
    });

    it('should handle JWT signing errors gracefully', async () => {
      const mockUser = { id: 'user-123' } as User;
      
      // Temporarily remove JWT_SECRET
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      await expect((authService as any).generateTokens(mockUser))
        .rejects.toThrow();

      // Restore
      process.env.JWT_SECRET = originalSecret;
    });

    it('should validate JWT signature', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      } as User;

      const tokens = await (authService as any).generateTokens(mockUser);
      
      // Valid signature
      expect(() => jwt.verify(tokens.accessToken, process.env.JWT_SECRET!))
        .not.toThrow();
      
      // Invalid signature
      expect(() => jwt.verify(tokens.accessToken, 'wrong-secret'))
        .toThrow('invalid signature');
    });
  });

  describe('Token Expiration', () => {
    it('should respect JWT_EXPIRES_IN environment variable', async () => {
      const mockUser = { id: 'user-123' } as User;
      
      // Set custom expiry
      process.env.JWT_EXPIRES_IN = '30m';
      
      const tokens = await (authService as any).generateTokens(mockUser);
      const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET!) as any;
      
      expect(decoded.exp - decoded.iat).toBe(1800); // 30 minutes
      
      // Reset
      process.env.JWT_EXPIRES_IN = '15m';
    });

    it('should create refresh tokens with 30-day expiration', async () => {
      const mockUser = { id: 'user-123' } as User;
      const mockTokenRecord = {
        user: mockUser,
        token: 'refresh-token',
        family: 'family-123',
        used: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        save: jest.fn(),
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockTokenRecord);
      mockRefreshTokenRepository.create.mockImplementation((data: Partial<RefreshToken>) => data);
      mockRefreshTokenRepository.save.mockImplementation((token: RefreshToken) => Promise.resolve(token));

      await authService.refreshTokens('refresh-token');

      expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expect.any(Date),
        })
      );

      const createCall = mockRefreshTokenRepository.create.mock.calls[0][0];
      const expiresAt = createCall.expiresAt;
      const expectedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Allow 1 second tolerance
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    });
  });

  describe('Custom JWT Matcher', () => {
    it('should validate JWT format with custom matcher', async () => {
      const mockUser = { id: 'user-123' } as User;
      const tokens = await (authService as any).generateTokens(mockUser);
      
      expect(tokens.accessToken).toBeValidJWT();
      expect('not-a-jwt').not.toBeValidJWT();
      expect('invalid.jwt').not.toBeValidJWT();
      expect('a.b.c.d').not.toBeValidJWT(); // Too many parts
    });
  });
});