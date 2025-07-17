import { SecureSupabaseClient } from '../supabaseSecure';
import { EnvironmentService } from '../../security/environment';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../../security/environment');

describe('SecureSupabaseClient', () => {
  let secureClient: SecureSupabaseClient;
  let mockEnvironmentService: jest.Mocked<EnvironmentService>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockEnvironmentService = {
      getSupabaseConfig: jest.fn(),
      isInitialized: jest.fn(),
      initialize: jest.fn(),
    } as any;

    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    secureClient = new SecureSupabaseClient(mockEnvironmentService);
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize Supabase client with secure credentials', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      await secureClient.initialize();

      expect(createClient).toHaveBeenCalledWith(
        'https://secure.supabase.co',
        'secure-anon-key',
        {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        }
      );
    });

    it('should initialize environment if not already initialized', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(false);
      mockEnvironmentService.initialize.mockResolvedValue();
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      await secureClient.initialize();

      expect(mockEnvironmentService.initialize).toHaveBeenCalled();
    });

    it('should throw error if credentials are invalid', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockRejectedValue(
        new Error('Invalid credentials')
      );

      await expect(secureClient.initialize()).rejects.toThrow(
        'Failed to initialize Supabase client'
      );
    });

    it('should not reinitialize if already initialized', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      await secureClient.initialize();
      await secureClient.initialize();

      expect(createClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('getClient', () => {
    it('should return initialized client', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      await secureClient.initialize();
      const client = await secureClient.getClient();

      expect(client).toBe(mockSupabaseClient);
    });

    it('should auto-initialize if not initialized', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      const client = await secureClient.getClient();

      expect(createClient).toHaveBeenCalled();
      expect(client).toBe(mockSupabaseClient);
    });

    it('should throw error if initialization fails', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockRejectedValue(
        new Error('Config error')
      );

      await expect(secureClient.getClient()).rejects.toThrow(
        'Failed to initialize Supabase client'
      );
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(secureClient.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      await secureClient.initialize();
      expect(secureClient.isInitialized()).toBe(true);
    });
  });

  describe('Row Level Security validation', () => {
    it('should validate RLS is enabled on tables', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      const mockRpc = jest.fn().mockResolvedValue({
        data: [
          { tablename: 'users', rowsecurity: true },
          { tablename: 'tasks', rowsecurity: true },
          { tablename: 'applications', rowsecurity: true },
          { tablename: 'mood_entries', rowsecurity: true },
          { tablename: 'budget_entries', rowsecurity: true },
          { tablename: 'coach_messages', rowsecurity: true },
        ],
        error: null,
      });

      mockSupabaseClient.rpc = mockRpc;

      await secureClient.initialize();
      const rlsEnabled = await secureClient.validateRowLevelSecurity();

      expect(rlsEnabled).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('check_rls_enabled');
    });

    it('should return false if any table has RLS disabled', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      const mockRpc = jest.fn().mockResolvedValue({
        data: [
          { tablename: 'users', rowsecurity: true },
          { tablename: 'tasks', rowsecurity: false }, // RLS disabled
          { tablename: 'applications', rowsecurity: true },
        ],
        error: null,
      });

      mockSupabaseClient.rpc = mockRpc;

      await secureClient.initialize();
      const rlsEnabled = await secureClient.validateRowLevelSecurity();

      expect(rlsEnabled).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      (createClient as jest.Mock).mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(secureClient.initialize()).rejects.toThrow(
        'Failed to initialize Supabase client'
      );
    });

    it('should clear client on critical errors', async () => {
      mockEnvironmentService.isInitialized.mockReturnValue(true);
      mockEnvironmentService.getSupabaseConfig.mockResolvedValue({
        url: 'https://secure.supabase.co',
        anonKey: 'secure-anon-key',
      });

      await secureClient.initialize();
      expect(secureClient.isInitialized()).toBe(true);

      // Simulate critical error
      await secureClient.handleCriticalError(new Error('Critical error'));
      expect(secureClient.isInitialized()).toBe(false);
    });
  });
});