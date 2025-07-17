import { KeychainService } from './keychain';
import { EnvironmentService } from './environment';
import { createSecureSupabaseClient } from '../api/supabaseSecure';
import { createSecureOpenAIService } from '../api/openaiSecure';

/**
 * Initialize all security services with proper dependency injection
 * This is the main entry point for secure service initialization
 */
export class SecurityServices {
  public readonly keychain: KeychainService;
  public readonly environment: EnvironmentService;
  public readonly supabase: ReturnType<typeof createSecureSupabaseClient>;
  public readonly openai: ReturnType<typeof createSecureOpenAIService>;

  constructor() {
    // Initialize services with dependency injection
    this.keychain = new KeychainService();
    this.environment = new EnvironmentService(this.keychain);
    this.supabase = createSecureSupabaseClient(this.environment);
    this.openai = createSecureOpenAIService(this.environment);
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    await this.environment.initialize();
    await this.supabase.initialize();
  }

  /**
   * Validate all services are properly configured
   */
  async validate(): Promise<{
    environment: boolean;
    supabase: boolean;
    openai: boolean;
    rowLevelSecurity: boolean;
  }> {
    const environmentValid = await this.environment.validateEnvironment();
    const supabaseValid = this.supabase.isInitialized();
    const openaiValid = await this.openai.validateApiKey();
    const rlsValid = await this.supabase.validateRowLevelSecurity();

    return {
      environment: environmentValid,
      supabase: supabaseValid,
      openai: openaiValid,
      rowLevelSecurity: rlsValid,
    };
  }
}

// Export singleton instance
let securityServices: SecurityServices | null = null;

export const getSecurityServices = (): SecurityServices => {
  if (!securityServices) {
    securityServices = new SecurityServices();
  }
  return securityServices;
};

// Export individual services for convenience
export { KeychainService } from './keychain';
export { EnvironmentService } from './environment';
export { SecureSupabaseClient } from '../api/supabaseSecure';
export { SecureOpenAIService } from '../api/openaiSecure';