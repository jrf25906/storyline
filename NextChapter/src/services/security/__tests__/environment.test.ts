import { EnvironmentService } from '../environment';
import { KeychainService } from '../keychain';
import Constants from 'expo-constants';

// Mock dependencies
jest.mock('../keychain');
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
}));

describe('EnvironmentService', () => {
  let environmentService: EnvironmentService;
  let mockKeychainService: jest.Mocked<KeychainService>;

  beforeEach(() => {
    mockKeychainService = new KeychainService() as jest.Mocked<KeychainService>;
    environmentService = new EnvironmentService(mockKeychainService);
    jest.clearAllMocks();

    // Reset environment variables
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  });

  describe('initialize', () => {
    it('should load credentials from keychain on initialization', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://secure.supabase.co',
        SUPABASE_ANON_KEY: 'secure-anon-key',
        OPENAI_API_KEY: 'secure-openai-key',
      });

      await environmentService.initialize();

      expect(mockKeychainService.getMultipleSecureValues).toHaveBeenCalledWith([
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'OPENAI_API_KEY',
      ]);
    });

    it('should fall back to environment variables if keychain is empty', async () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://env.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'env-anon-key';
      process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'env-openai-key';

      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: null,
        SUPABASE_ANON_KEY: null,
        OPENAI_API_KEY: null,
      });

      await environmentService.initialize();

      const config = await environmentService.getSupabaseConfig();
      expect(config.url).toBe('https://env.supabase.co');
      expect(config.anonKey).toBe('env-anon-key');
    });

    it('should throw error if required credentials are missing', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: null,
        SUPABASE_ANON_KEY: null,
        OPENAI_API_KEY: null,
      });

      await expect(environmentService.initialize()).rejects.toThrow(
        'Missing required environment variables'
      );
    });
  });

  describe('getSupabaseConfig', () => {
    it('should return Supabase configuration from secure storage', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://secure.supabase.co',
        SUPABASE_ANON_KEY: 'secure-anon-key',
        OPENAI_API_KEY: 'secure-openai-key',
      });

      await environmentService.initialize();
      const config = await environmentService.getSupabaseConfig();

      expect(config).toEqual({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });
    });

    it('should throw error if Supabase credentials are not initialized', async () => {
      await expect(environmentService.getSupabaseConfig()).rejects.toThrow(
        'Environment not initialized. Call initialize() first.'
      );
    });

    it('should validate Supabase URL format', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'invalid-url',
        SUPABASE_ANON_KEY: 'key',
        OPENAI_API_KEY: 'key',
      });

      await expect(environmentService.initialize()).rejects.toThrow(
        'Invalid Supabase URL format'
      );
    });
  });

  describe('getOpenAIConfig', () => {
    it('should return OpenAI configuration from secure storage', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://secure.supabase.co',
        SUPABASE_ANON_KEY: 'secure-anon-key',
        OPENAI_API_KEY: 'secure-openai-key',
      });

      await environmentService.initialize();
      const config = await environmentService.getOpenAIConfig();

      expect(config).toEqual({
        apiKey: 'secure-openai-key',
      });
    });

    it('should throw error if OpenAI credentials are not initialized', async () => {
      await expect(environmentService.getOpenAIConfig()).rejects.toThrow(
        'Environment not initialized. Call initialize() first.'
      );
    });
  });

  describe('setCredentials', () => {
    it('should store credentials securely and update cache', async () => {
      mockKeychainService.setMultipleSecureValues.mockResolvedValue();
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://old.supabase.co',
        SUPABASE_ANON_KEY: 'old-key',
        OPENAI_API_KEY: 'old-openai',
      });

      await environmentService.initialize();

      const newCredentials = {
        supabaseUrl: 'https://new.supabase.co',
        supabaseAnonKey: 'new-anon-key',
        openAIApiKey: 'new-openai-key',
      };

      await environmentService.setCredentials(newCredentials);

      expect(mockKeychainService.setMultipleSecureValues).toHaveBeenCalledWith({
        SUPABASE_URL: 'https://new.supabase.co',
        SUPABASE_ANON_KEY: 'new-anon-key',
        OPENAI_API_KEY: 'new-openai-key',
      });

      const config = await environmentService.getSupabaseConfig();
      expect(config.url).toBe('https://new.supabase.co');
    });

    it('should validate credentials before storing', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://old.supabase.co',
        SUPABASE_ANON_KEY: 'old-key',
        OPENAI_API_KEY: 'old-openai',
      });

      await environmentService.initialize();

      const invalidCredentials = {
        supabaseUrl: '',
        supabaseAnonKey: 'key',
        openAIApiKey: 'key',
      };

      await expect(environmentService.setCredentials(invalidCredentials)).rejects.toThrow(
        'Invalid credentials: URL cannot be empty'
      );
    });
  });

  describe('clearCredentials', () => {
    it('should clear all stored credentials', async () => {
      mockKeychainService.clearAllSecureValues.mockResolvedValue();

      await environmentService.clearCredentials();

      expect(mockKeychainService.clearAllSecureValues).toHaveBeenCalled();
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(environmentService.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://secure.supabase.co',
        SUPABASE_ANON_KEY: 'secure-anon-key',
        OPENAI_API_KEY: 'secure-openai-key',
      });

      await environmentService.initialize();
      expect(environmentService.isInitialized()).toBe(true);
    });
  });

  describe('validateEnvironment', () => {
    it('should validate all required environment variables', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://secure.supabase.co',
        SUPABASE_ANON_KEY: 'secure-anon-key',
        OPENAI_API_KEY: 'secure-openai-key',
      });

      await environmentService.initialize();
      const isValid = await environmentService.validateEnvironment();

      expect(isValid).toBe(true);
    });

    it('should return false if any required variable is missing', async () => {
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://secure.supabase.co',
        SUPABASE_ANON_KEY: null,
        OPENAI_API_KEY: 'secure-openai-key',
      });

      await expect(environmentService.initialize()).rejects.toThrow();
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return current environment information', async () => {
      // Use Object.defineProperty to modify NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
      
      mockKeychainService.getMultipleSecureValues.mockResolvedValue({
        SUPABASE_URL: 'https://secure.supabase.co',
        SUPABASE_ANON_KEY: 'secure-anon-key',
        OPENAI_API_KEY: 'secure-openai-key',
      });

      await environmentService.initialize();
      const info = environmentService.getEnvironmentInfo();

      expect(info).toEqual({
        environment: 'development',
        isProduction: false,
        hasSupabaseConfig: true,
        hasOpenAIConfig: true,
      });
    });
  });
});