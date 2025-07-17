import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnvironmentService } from '../security/environment';

/**
 * Secure Supabase client with environment-based configuration
 * Implements dependency injection and lazy initialization
 */
export class SecureSupabaseClient {
  private client?: SupabaseClient;
  private initPromise?: Promise<void>;

  constructor(private environmentService: EnvironmentService) {}

  /**
   * Initialize Supabase client with secure credentials
   */
  async initialize(): Promise<void> {
    // Avoid multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    // Already initialized
    if (this.client) {
      return;
    }

    this.initPromise = this.doInitialize();
    await this.initPromise;
    this.initPromise = undefined;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Ensure environment is initialized
      if (!this.environmentService.isInitialized()) {
        await this.environmentService.initialize();
      }

      const config = await this.environmentService.getSupabaseConfig();

      this.client = createClient(config.url, config.anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
    } catch (error) {
      throw new Error('Failed to initialize Supabase client');
    }
  }

  /**
   * Get initialized Supabase client
   */
  async getClient(): Promise<SupabaseClient> {
    if (!this.client) {
      await this.initialize();
    }

    if (!this.client) {
      throw new Error('Failed to initialize Supabase client');
    }

    return this.client;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return !!this.client;
  }

  /**
   * Validate that Row Level Security is enabled on all tables
   */
  async validateRowLevelSecurity(): Promise<boolean> {
    const client = await this.getClient();

    try {
      // This would be a custom RPC function in your Supabase database
      const { data, error } = await client.rpc('check_rls_enabled');

      if (error) {
        console.error('Error checking RLS:', error);
        return false;
      }

      // Check that all tables have RLS enabled
      const tables = data as Array<{ tablename: string; rowsecurity: boolean }>;
      const requiredTables = [
        'users',
        'tasks',
        'applications',
        'mood_entries',
        'budget_entries',
        'coach_messages',
      ];

      for (const tableName of requiredTables) {
        const table = tables.find((t) => t.tablename === tableName);
        if (!table || !table.rowsecurity) {
          console.error(`RLS not enabled for table: ${tableName}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to validate RLS:', error);
      return false;
    }
  }

  /**
   * Handle critical errors by clearing the client
   */
  async handleCriticalError(error: Error): Promise<void> {
    console.error('Critical Supabase error:', error);
    this.client = undefined;
  }
}

// Export singleton instance with dependency injection setup
export const createSecureSupabaseClient = (
  environmentService: EnvironmentService
): SecureSupabaseClient => {
  return new SecureSupabaseClient(environmentService);
};