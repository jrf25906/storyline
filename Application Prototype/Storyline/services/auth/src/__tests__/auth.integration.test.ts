import request from 'supertest';
import express from 'express';
import { AuthService } from '../services/AuthService';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { getRepository } from 'typeorm';
import jwt from 'jsonwebtoken';
import { incrementLoginAttempts, resetLoginAttempts, blacklistToken } from '../config/redis';

// Mock dependencies
jest.mock('typeorm');
jest.mock('../utils/logger');
jest.mock('../utils/email');
jest.mock('../config/redis');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock auth endpoints
  app.post('/auth/signup', async (req, res) => {
    try {
      const authService = new AuthService();
      const result = await authService.signup(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  app.post('/auth/login', async (req, res) => {
    try {
      const authService = new AuthService();
      const deviceInfo = {
        userAgent: req.headers['user-agent'] || 'test-agent',
        ip: req.ip || '127.0.0.1',
        platform: 'web',
      };
      const result = await authService.login(req.body, deviceInfo);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });
  
  app.post('/auth/refresh', async (req, res) => {
    try {
      const authService = new AuthService();
      const tokens = await authService.refreshTokens(req.body.refreshToken);
      res.json(tokens);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });
  
  app.post('/auth/logout', async (req, res) => {
    try {
      const authService = new AuthService();
      const token = req.headers.authorization?.replace('Bearer ', '') || '';
      await authService.logout(token);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  return app;
};

describe('Authentication Integration Tests', () => {
  let app: express.Application;
  let mockUserRepository: any;
  let mockRefreshTokenRepository: any;
  let mockSessionRepository: any;

  beforeEach(() => {
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

    (getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === RefreshToken) return mockRefreshTokenRepository;
      return mockSessionRepository;
    });

    app = createTestApp();
  });

  describe('Complete User Journey', () => {
    it('should complete full authentication flow', async () => {
      // Step 1: Signup
      const signupData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };

      mockUserRepository.findOne.mockResolvedValueOnce(null); // No existing user
      mockUserRepository.create.mockImplementation((data) => ({
        ...data,
        id: 'new-user-id',
        hashPassword: jest.fn(),
        emailVerificationToken: 'verify-token',
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }));
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      const signupResponse = await request(app)
        .post('/auth/signup')
        .send(signupData)
        .expect(200);

      expect(signupResponse.body).toHaveProperty('user');
      expect(signupResponse.body).toHaveProperty('tokens');
      expect(signupResponse.body.user.email).toBe(signupData.email);

      // Step 2: Email Verification (simulate)
      const verifyUser = signupResponse.body.user;
      verifyUser.emailVerified = true;
      
      // Step 3: Login
      const loginUser = {
        ...verifyUser,
        password: '$2a$10$hashedpassword',
        emailVerified: true,
        isLocked: () => false,
        comparePassword: jest.fn().mockResolvedValue(true),
        resetLoginAttempts: jest.fn(),
        incrementLoginAttempts: jest.fn(),
        save: jest.fn(),
      };

      mockUserRepository.findOne.mockResolvedValue(loginUser);
      mockSessionRepository.create.mockImplementation((data) => ({ ...data, id: 'session-id' }));
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: signupData.email,
          password: signupData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('tokens');
      expect(loginResponse.body.tokens).toHaveProperty('accessToken');
      expect(loginResponse.body.tokens).toHaveProperty('refreshToken');

      // Step 4: Use Access Token (validate JWT)
      const { accessToken } = loginResponse.body.tokens;
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
      expect(decoded.email).toBe(signupData.email);

      // Step 5: Refresh Token
      const mockTokenRecord = {
        id: 'token-id',
        user: loginUser,
        token: loginResponse.body.tokens.refreshToken,
        family: 'family-123',
        used: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        save: jest.fn(),
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(mockTokenRecord);
      mockRefreshTokenRepository.create.mockImplementation((data) => ({ ...data, id: 'new-token-id' }));
      mockRefreshTokenRepository.save.mockImplementation((token) => Promise.resolve(token));

      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: loginResponse.body.tokens.refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
      expect(refreshResponse.body.refreshToken).not.toBe(loginResponse.body.tokens.refreshToken);

      // Step 6: Logout
      const logoutResponse = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
      expect(blacklistToken).toHaveBeenCalled();
      expect(mockSessionRepository.update).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle duplicate email signup', async () => {
      const existingUser = {
        id: 'existing-user',
        email: 'existing@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });

    it('should handle invalid login credentials', async () => {
      const user = {
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        isLocked: () => false,
        comparePassword: jest.fn().mockResolvedValue(false),
        incrementLoginAttempts: jest.fn(),
        save: jest.fn(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
      expect(user.incrementLoginAttempts).toHaveBeenCalled();
      expect(incrementLoginAttempts).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle locked account', async () => {
      const lockedUser = {
        email: 'locked@example.com',
        isLocked: () => true,
      };

      mockUserRepository.findOne.mockResolvedValue(lockedUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'locked@example.com',
          password: 'any-password',
        })
        .expect(401);

      expect(response.body.error).toBe('Account is locked. Please try again later.');
    });

    it('should handle unverified email', async () => {
      const unverifiedUser = {
        email: 'unverified@example.com',
        emailVerified: false,
        isLocked: () => false,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      mockUserRepository.findOne.mockResolvedValue(unverifiedUser);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'correct-password',
        })
        .expect(401);

      expect(response.body.error).toBe('Please verify your email before logging in');
    });

    it('should handle expired refresh token', async () => {
      const expiredToken = {
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
        used: false,
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(expiredToken);

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'expired-token',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid or expired refresh token');
    });

    it('should handle token reuse attack', async () => {
      const usedToken = {
        token: 'used-token',
        family: 'family-123',
        used: true,
        expiresAt: new Date(Date.now() + 1000),
      };

      mockRefreshTokenRepository.findOne.mockResolvedValue(usedToken);

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'used-token',
        })
        .expect(401);

      expect(response.body.error).toBe('Token reuse detected. All tokens revoked.');
      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(
        { family: 'family-123' },
        { revokedAt: expect.any(Date) }
      );
    });
  });

  describe('Security Headers', () => {
    it('should not expose sensitive information in responses', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        twoFactorSecret: 'secret',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((data) => ({
        ...data,
        ...user,
      }));
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      // Password and secrets should not be in response
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('twoFactorSecret');
    });
  });

  describe('Rate Limiting', () => {
    it('should track failed login attempts', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      // Simulate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            email: 'attacker@example.com',
            password: 'wrong-password',
          })
          .expect(401);
      }

      expect(incrementLoginAttempts).toHaveBeenCalledTimes(3);
      expect(incrementLoginAttempts).toHaveBeenCalledWith('attacker@example.com');
    });
  });

  describe('Session Management', () => {
    it('should create session on successful login', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        isLocked: () => false,
        comparePassword: jest.fn().mockResolvedValue(true),
        resetLoginAttempts: jest.fn(),
        save: jest.fn(),
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockSessionRepository.create.mockImplementation((data) => ({
        ...data,
        id: 'session-123',
      }));
      mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));

      await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correct-password',
        })
        .expect(200);

      expect(mockSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          token: expect.any(String),
          deviceInfo: expect.objectContaining({
            userAgent: expect.any(String),
            ip: expect.any(String),
          }),
          expiresAt: expect.any(Date),
        })
      );
      expect(mockSessionRepository.save).toHaveBeenCalled();
    });

    it('should invalidate session on logout', async () => {
      const token = jwt.sign(
        { id: 'user-123', email: 'test@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(blacklistToken).toHaveBeenCalledWith(token, expect.any(Number));
      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { token },
        { isActive: false, revokedAt: expect.any(Date) }
      );
    });
  });
});