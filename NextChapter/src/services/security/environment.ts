import { KeychainService } from './keychain';
import Constants from 'expo-constants';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface OpenAIConfig {
  apiKey: string;
}

interface Credentials {
  supabaseUrl: string;
  supabaseAnonKey: string;
  openAIApiKey: string;
}

/**
 * Service for managing environment variables and secure credential storage
 * Follows SOLID principles with dependency injection
 */
export class EnvironmentService {
  private initialized = false;
  private supabaseConfig?: SupabaseConfig;
  private openAIConfig?: OpenAIConfig;

  constructor(private keychainService: KeychainService) {}

  /**
   * Initialize environment with secure credential loading
   */
  async initialize(): Promise<void> {
    try {
      // Load credentials from keychain
      const secureValues = await this.keychainService.getMultipleSecureValues([
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'OPENAI_API_KEY',
      ]);

      // Fall back to environment variables if not in keychain
      const supabaseUrl =
        secureValues.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey =
        secureValues.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      const openAIApiKey =
        secureValues.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

      // Validate required credentials
      if (!supabaseUrl || !supabaseAnonKey || !openAIApiKey) {
        throw new Error('Missing required environment variables');
      }

      // Validate Supabase URL format
      if (!this.isValidSupabaseUrl(supabaseUrl)) {
        throw new Error('Invalid Supabase URL format');
      }

      // Set configurations
      this.supabaseConfig = {
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      };

      this.openAIConfig = {
        apiKey: openAIApiKey,
      };

      this.initialized = true;
    } catch (error) {
      this.initialized = false;
      throw error;
    }
  }

  /**
   * Get Supabase configuration
   */
  async getSupabaseConfig(): Promise<SupabaseConfig> {
    if (!this.initialized || !this.supabaseConfig) {
      throw new Error('Environment not initialized. Call initialize() first.');
    }
    return this.supabaseConfig;
  }

  /**
   * Get OpenAI configuration
   */
  async getOpenAIConfig(): Promise<OpenAIConfig> {
    if (!this.initialized || !this.openAIConfig) {
      throw new Error('Environment not initialized. Call initialize() first.');
    }
    return this.openAIConfig;
  }

  /**
   * Update credentials securely
   */
  async setCredentials(credentials: Credentials): Promise<void> {
    // Validate credentials
    if (!credentials.supabaseUrl) {
      throw new Error('Invalid credentials: URL cannot be empty');
    }

    if (!this.isValidSupabaseUrl(credentials.supabaseUrl)) {
      throw new Error('Invalid Supabase URL format');
    }

    // Store in keychain
    await this.keychainService.setMultipleSecureValues({
      SUPABASE_URL: credentials.supabaseUrl,
      SUPABASE_ANON_KEY: credentials.supabaseAnonKey,
      OPENAI_API_KEY: credentials.openAIApiKey,
    });

    // Update in-memory config
    this.supabaseConfig = {
      url: credentials.supabaseUrl,
      anonKey: credentials.supabaseAnonKey,
    };

    this.openAIConfig = {
      apiKey: credentials.openAIApiKey,
    };

    this.initialized = true;
  }

  /**
   * Clear all stored credentials
   */
  async clearCredentials(): Promise<void> {
    await this.keychainService.clearAllSecureValues();
    this.supabaseConfig = undefined;
    this.openAIConfig = undefined;
    this.initialized = false;
  }

  /**
   * Check if environment is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Validate all required environment variables are present
   */
  async validateEnvironment(): Promise<boolean> {
    try {
      await this.getSupabaseConfig();
      await this.getOpenAIConfig();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get information about current environment
   */
  getEnvironmentInfo(): {
    environment: string;
    isProduction: boolean;
    hasSupabaseConfig: boolean;
    hasOpenAIConfig: boolean;
  } {
    return {
      environment: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production',
      hasSupabaseConfig: !!this.supabaseConfig,
      hasOpenAIConfig: !!this.openAIConfig,
    };
  }

  /**
   * Validate Supabase URL format
   */
  private isValidSupabaseUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && url.includes('supabase');
    } catch {
      return false;
    }
  }
}