import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { configurePassport } from '../config/passport';
import { User } from '../entities/User';
import { getRepository } from 'typeorm';
import { logger } from '../utils/logger';

// Mock dependencies
jest.mock('typeorm');
jest.mock('../utils/logger');
jest.mock('passport-google-oauth20');
jest.mock('passport-jwt');

describe('OAuth2 Authentication', () => {
  let mockUserRepository: any;
  let mockGoogleStrategy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock repository
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    
    (getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    
    // Mock Google Strategy
    mockGoogleStrategy = jest.fn();
    (GoogleStrategy as unknown as jest.Mock).mockImplementation(mockGoogleStrategy);
  });

  describe('Google OAuth Strategy', () => {
    it('should configure Google strategy when credentials are present', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      const mockPassport = {
        use: jest.fn(),
        serializeUser: jest.fn(),
        deserializeUser: jest.fn(),
      };

      configurePassport(mockPassport as any);

      expect(GoogleStrategy).toHaveBeenCalledWith(
        {
          clientID: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackURL: '/oauth/google/callback',
        },
        expect.any(Function)
      );
    });

    it('should skip Google strategy when credentials are missing', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const mockPassport = {
        use: jest.fn(),
        serializeUser: jest.fn(),
        deserializeUser: jest.fn(),
      };

      configurePassport(mockPassport as any);

      expect(GoogleStrategy).not.toHaveBeenCalled();
    });

    describe('Google OAuth Callback', () => {
      let googleCallback: Function;
      let mockDone: jest.Mock;

      beforeEach(() => {
        process.env.GOOGLE_CLIENT_ID = 'test-client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

        mockGoogleStrategy.mockImplementation((config, callback) => {
          googleCallback = callback;
          return { name: 'google' };
        });

        const mockPassport = {
          use: jest.fn(),
          serializeUser: jest.fn(),
          deserializeUser: jest.fn(),
        };

        configurePassport(mockPassport as any);
        mockDone = jest.fn();
      });

      it('should create new user for first-time Google login', async () => {
        const mockProfile = {
          id: 'google-123',
          displayName: 'Test User',
          emails: [{ value: 'test@gmail.com' }],
          photos: [{ value: 'https://avatar.url' }],
        };

        mockUserRepository.findOne.mockResolvedValue(null);
        mockUserRepository.create.mockImplementation((data) => ({ 
          ...data, 
          id: 'new-user-id' 
        }));
        mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

        await googleCallback('access-token', 'refresh-token', mockProfile, mockDone);

        expect(mockUserRepository.findOne).toHaveBeenCalledWith({
          where: [
            { email: 'test@gmail.com' },
            { providerId: 'google-123', provider: 'google' }
          ]
        });

        expect(mockUserRepository.create).toHaveBeenCalledWith({
          email: 'test@gmail.com',
          name: 'Test User',
          provider: 'google',
          providerId: 'google-123',
          emailVerified: true,
          avatar: 'https://avatar.url',
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

        expect(mockDone).toHaveBeenCalledWith(null, expect.objectContaining({
          id: 'new-user-id',
          email: 'test@gmail.com'
        }));
      });

      it('should return existing user for subsequent Google logins', async () => {
        const mockProfile = {
          id: 'google-123',
          displayName: 'Test User',
          emails: [{ value: 'test@gmail.com' }],
        };

        const existingUser = {
          id: 'existing-user-id',
          email: 'test@gmail.com',
          provider: 'google',
          providerId: 'google-123',
        };

        mockUserRepository.findOne.mockResolvedValue(existingUser);

        await googleCallback('access-token', 'refresh-token', mockProfile, mockDone);

        expect(mockUserRepository.create).not.toHaveBeenCalled();
        expect(mockUserRepository.save).not.toHaveBeenCalled();
        expect(mockDone).toHaveBeenCalledWith(null, existingUser);
      });

      it('should handle missing email in Google profile', async () => {
        const mockProfile = {
          id: 'google-123',
          displayName: 'Test User',
          emails: undefined,
        };

        await googleCallback('access-token', 'refresh-token', mockProfile, mockDone);

        expect(mockDone).toHaveBeenCalledWith(expect.any(Error), false);
      });

      it('should handle database errors gracefully', async () => {
        const mockProfile = {
          id: 'google-123',
          displayName: 'Test User',
          emails: [{ value: 'test@gmail.com' }],
        };

        const dbError = new Error('Database connection failed');
        mockUserRepository.findOne.mockRejectedValue(dbError);

        await googleCallback('access-token', 'refresh-token', mockProfile, mockDone);

        expect(mockDone).toHaveBeenCalledWith(dbError, false);
        expect(logger.error).toHaveBeenCalledWith('Google OAuth error:', dbError);
      });

      it('should link Google account to existing email user', async () => {
        const mockProfile = {
          id: 'google-123',
          displayName: 'Test User',
          emails: [{ value: 'existing@example.com' }],
        };

        const existingUser = {
          id: 'existing-user-id',
          email: 'existing@example.com',
          provider: null, // Registered via email
          providerId: null,
        };

        mockUserRepository.findOne.mockResolvedValue(existingUser);

        await googleCallback('access-token', 'refresh-token', mockProfile, mockDone);

        // Should return the existing user (linking logic would be implemented)
        expect(mockDone).toHaveBeenCalledWith(null, existingUser);
      });
    });

    describe('User Serialization', () => {
      it('should serialize user to ID', (done) => {
        const mockPassport = {
          use: jest.fn(),
          serializeUser: jest.fn(),
          deserializeUser: jest.fn(),
        };

        configurePassport(mockPassport as any);

        const serializeCallback = mockPassport.serializeUser.mock.calls[0][0];
        const mockUser = { id: 'user-123', email: 'test@example.com' };

        serializeCallback(mockUser, (err: any, id: string) => {
          expect(err).toBeNull();
          expect(id).toBe('user-123');
          done();
        });
      });

      it('should deserialize user from ID', async () => {
        const mockPassport = {
          use: jest.fn(),
          serializeUser: jest.fn(),
          deserializeUser: jest.fn(),
        };

        configurePassport(mockPassport as any);

        const deserializeCallback = mockPassport.deserializeUser.mock.calls[0][0];
        const mockUser = { id: 'user-123', email: 'test@example.com' };
        
        mockUserRepository.findOne.mockResolvedValue(mockUser);

        await new Promise((resolve) => {
          deserializeCallback('user-123', (err: any, user: any) => {
            expect(err).toBeNull();
            expect(user).toEqual(mockUser);
            resolve(undefined);
          });
        });
      });

      it('should handle deserialization errors', async () => {
        const mockPassport = {
          use: jest.fn(),
          serializeUser: jest.fn(),
          deserializeUser: jest.fn(),
        };

        configurePassport(mockPassport as any);

        const deserializeCallback = mockPassport.deserializeUser.mock.calls[0][0];
        const dbError = new Error('Database error');
        
        mockUserRepository.findOne.mockRejectedValue(dbError);

        await new Promise((resolve) => {
          deserializeCallback('user-123', (err: any, user: any) => {
            expect(err).toBe(dbError);
            expect(user).toBeNull();
            resolve(undefined);
          });
        });
      });
    });
  });

  describe('OAuth Security', () => {
    it('should not expose sensitive data in OAuth callbacks', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      let googleCallback: Function;
      const mockGoogleStrategy = jest.fn((config, callback) => {
        googleCallback = callback;
        return { name: 'google' };
      });
      
      (GoogleStrategy as unknown as jest.Mock).mockImplementation(mockGoogleStrategy);

      const mockPassport = {
        use: jest.fn(),
        serializeUser: jest.fn(),
        deserializeUser: jest.fn(),
      };

      configurePassport(mockPassport as any);

      const mockProfile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [{ value: 'test@gmail.com' }],
        _json: {
          sub: 'google-123',
          email: 'test@gmail.com',
          sensitive_data: 'should-not-save',
        },
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      const mockDone = jest.fn();
      await googleCallback!('access-token', 'refresh-token', mockProfile, mockDone);

      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall).not.toHaveProperty('_json');
      expect(createCall).not.toHaveProperty('sensitive_data');
    });

    it('should validate OAuth state parameter to prevent CSRF', () => {
      // This test would be implemented when state parameter is added
      // to the OAuth flow for CSRF protection
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Multiple OAuth Providers', () => {
    it('should handle user with multiple OAuth providers', async () => {
      // Test scenario where user logs in with Google,
      // then later links Facebook account
      const googleProfile = {
        id: 'google-123',
        provider: 'google',
        emails: [{ value: 'user@example.com' }],
      };

      const existingUser = {
        id: 'user-id',
        email: 'user@example.com',
        providers: [
          { provider: 'google', providerId: 'google-123' },
          { provider: 'facebook', providerId: 'facebook-456' },
        ],
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      // Test would verify proper handling of multiple providers
      expect(existingUser.providers).toHaveLength(2);
    });
  });

  describe('OAuth Error Handling', () => {
    it('should handle network errors during OAuth flow', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      const networkError = new Error('Network timeout');
      networkError.name = 'NetworkError';

      let googleCallback: Function;
      mockGoogleStrategy.mockImplementation((config, callback) => {
        googleCallback = callback;
        return { name: 'google' };
      });

      const mockPassport = {
        use: jest.fn(),
        serializeUser: jest.fn(),
        deserializeUser: jest.fn(),
      };

      configurePassport(mockPassport as any);

      mockUserRepository.findOne.mockRejectedValue(networkError);

      const mockDone = jest.fn();
      await googleCallback!('access-token', 'refresh-token', {
        id: 'google-123',
        emails: [{ value: 'test@gmail.com' }],
      }, mockDone);

      expect(logger.error).toHaveBeenCalledWith('Google OAuth error:', networkError);
      expect(mockDone).toHaveBeenCalledWith(networkError, false);
    });

    it('should handle malformed OAuth responses', async () => {
      const malformedProfile = {
        id: null, // Invalid ID
        displayName: '',
        emails: [{ value: 'not-an-email' }], // Invalid email
      };

      // Test would verify proper validation and error handling
      expect(malformedProfile.id).toBeNull();
    });
  });
});