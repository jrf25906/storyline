/**
 * Service initialization and dependency injection setup
 * Configures all service adapters and registers them with the container
 */

import { createClient } from '@supabase/supabase-js';
import { services } from '@services/ServiceContainer';

// Adapters
import { OpenAIAdapter } from '@services/adapters/ai/OpenAIAdapter';
import { OpenAICoachAdapter } from '@services/adapters/ai/OpenAICoachAdapter';
import { SupabaseAuthAdapter } from '@services/adapters/auth/SupabaseAuthAdapter';
import { UnifiedStorageAdapter } from '@services/adapters/storage/UnifiedStorageAdapter';
import { WatermelonDBAdapter } from '@services/adapters/database/WatermelonDBAdapter';
import { ExpoNotificationAdapter } from '@services/adapters/notification/ExpoNotificationAdapter';

// Database
import { database } from '@services/database/watermelon/database';

// Security services
import { getSecurityServices } from '@services/security';

// Analytics
import { getAnalytics } from '@services/analytics';

// Types
import { Result, ok, err } from '@services/interfaces/common/result';
import { ServiceError } from '@services/interfaces/common/errors';

export interface ServiceInitializationResult {
  initialized: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Initialize all application services
 * This should be called once during app startup
 */
export async function initializeServices(): Promise<Result<ServiceInitializationResult>> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let initialized = false;

  try {
    console.log('🚀 Initializing NextChapter services...');

    // Step 1: Initialize security services and validate environment
    console.log('1️⃣ Initializing security services...');
    const securityServices = getSecurityServices();
    await securityServices.initialize();
    
    const validation = await securityServices.validate();
    
    if (!validation.environment) {
      errors.push('Environment configuration is invalid');
      return err(new ServiceError('INIT_ERROR', 'Environment configuration failed'));
    }
    
    if (!validation.supabase) {
      errors.push('Supabase configuration is invalid');
      return err(new ServiceError('INIT_ERROR', 'Supabase configuration failed'));
    }
    
    if (!validation.openai) {
      warnings.push('OpenAI configuration is invalid - AI features will be limited');
    }
    
    if (!validation.rowLevelSecurity) {
      warnings.push('Row Level Security is not properly configured on all tables');
      if (process.env.NODE_ENV === 'production') {
        errors.push('Row Level Security must be enabled in production');
        return err(new ServiceError('INIT_ERROR', 'Security configuration failed'));
      }
    }

    // Step 2: Create Supabase client
    console.log('2️⃣ Creating Supabase client...');
    const credentials = await securityServices.environment.getCredentials();
    if (!credentials.supabaseUrl || !credentials.supabaseAnonKey) {
      errors.push('Supabase credentials not found');
      return err(new ServiceError('INIT_ERROR', 'Missing Supabase credentials'));
    }

    const supabaseClient = createClient(
      credentials.supabaseUrl,
      credentials.supabaseAnonKey,
      {
        auth: {
          storage: {
            getItem: async (key: string) => {
              const result = await storageAdapter.get(key);
              return result.isOk() ? result.value : null;
            },
            setItem: async (key: string, value: string) => {
              await storageAdapter.set(key, value);
            },
            removeItem: async (key: string) => {
              await storageAdapter.remove(key);
            },
          },
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );

    // Step 3: Initialize storage adapter
    console.log('3️⃣ Initializing storage services...');
    const storageAdapter = new UnifiedStorageAdapter();
    services.register('storage', () => storageAdapter);

    // Step 4: Initialize auth services
    console.log('4️⃣ Initializing authentication services...');
    const authAdapter = new SupabaseAuthAdapter(supabaseClient);
    services.register('auth', () => authAdapter);

    // Import and register biometric service
    const { biometricService } = await import('./auth/biometricService');
    services.register('biometric', () => biometricService);

    // Step 5: Initialize AI services (if configured)
    console.log('5️⃣ Initializing AI services...');
    if (credentials.openAIApiKey) {
      const openAIAdapter = new OpenAIAdapter(credentials.openAIApiKey);
      const coachAdapter = new OpenAICoachAdapter(openAIAdapter, storageAdapter);
      
      services.register('chat', () => openAIAdapter);
      services.register('coach', () => coachAdapter);
    } else {
      warnings.push('AI services not configured - coach features will be unavailable');
    }

    // Step 6: Initialize database services
    console.log('6️⃣ Initializing database services...');
    
    // Register data service factories for each entity
    const entities = [
      'Profile',
      'LayoffDetails', 
      'BouncePlanTask',
      'JobApplication',
      'BudgetEntry',
      'MoodEntry',
      'CoachConversation',
      'UserGoal',
      'WellnessActivity'
    ];

    for (const entity of entities) {
      services.register(
        `data.${entity}`,
        () => new WatermelonDBAdapter(database, entity.toLowerCase())
      );
    }

    // Step 7: Initialize notification services
    console.log('7️⃣ Initializing notification services...');
    const notificationAdapter = new ExpoNotificationAdapter(storageAdapter);
    services.register('notifications', () => notificationAdapter);

    // Step 8: Initialize analytics
    console.log('8️⃣ Initializing analytics services...');
    try {
      const analytics = getAnalytics();
      services.register('analytics', () => analytics);
      
      // Track successful initialization
      analytics.trackEvent('app_services_initialized', {
        warnings: warnings.length,
        has_ai: !!credentials.openAIApiKey,
      });
    } catch (analyticsError) {
      warnings.push(`Analytics initialization failed: ${analyticsError}`);
    }

    // Step 9: Initialize sync services
    console.log('9️⃣ Initializing sync services...');
    const { SyncManager } = await import('./database/watermelon/sync/syncManager');
    const syncManager = new SyncManager(database, supabaseClient);
    services.register('sync', () => syncManager);

    // Step 10: Initialize network monitoring
    console.log('🔟 Initializing network services...');
    const { NetworkService } = await import('./network/NetworkService');
    const networkService = new NetworkService();
    services.register('network', () => networkService);

    // Step 11: Initialize encryption services
    console.log('1️⃣1️⃣ Initializing encryption services...');
    services.register('encryption', () => securityServices.environment);
    services.register('keyManager', () => securityServices.keychain);

    initialized = true;
    console.log('✅ All services initialized successfully!');

    return ok({
      initialized,
      errors,
      warnings,
    });

  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    errors.push(`Initialization failed: ${error}`);
    
    return err(new ServiceError(
      'INIT_ERROR',
      'Service initialization failed',
      { errors, warnings, originalError: error }
    ));
  }
}

/**
 * Cleanup and destroy all services
 * Should be called when app is terminating
 */
export async function destroyServices(): Promise<void> {
  console.log('🧹 Cleaning up services...');

  try {
    // Stop sync manager
    const syncManager = services.has('sync') ? services.resolve('sync') : null;
    if (syncManager && 'stopSync' in syncManager) {
      await syncManager.stopSync();
    }

    // Clean up storage listeners
    const storage = services.has('storage') ? services.resolve('storage') : null;
    if (storage && 'destroy' in storage) {
      storage.destroy();
    }

    // Clean up notification listeners  
    const notifications = services.has('notifications') ? services.resolve('notifications') : null;
    if (notifications && 'destroy' in notifications) {
      notifications.destroy();
    }

    // Clean up network listeners
    const network = services.has('network') ? services.resolve('network') : null;
    if (network && 'destroy' in network) {
      network.destroy();
    }

    // Clear service container
    services.reset();

    console.log('✅ All services cleaned up successfully');
  } catch (error) {
    console.error('Error during service cleanup:', error);
  }
}

/**
 * Check if all critical services are available
 */
export function areServicesReady(): boolean {
  const criticalServices = [
    'storage',
    'auth',
    'data.Profile',
    'notifications',
    'analytics',
  ];

  return criticalServices.every(service => services.has(service));
}

/**
 * Get service health status
 */
export async function getServiceHealth(): Promise<{
  healthy: boolean;
  services: Record<string, { available: boolean; error?: string }>;
}> {
  const serviceStatus: Record<string, { available: boolean; error?: string }> = {};

  // Check auth
  try {
    const auth = services.auth;
    const session = await auth.getCurrentSession();
    serviceStatus.auth = { available: session.isOk() || session.error.code === 'AUTH_ERROR' };
  } catch (error) {
    serviceStatus.auth = { available: false, error: String(error) };
  }

  // Check storage
  try {
    const storage = services.storage;
    const testKey = '_health_check';
    await storage.set(testKey, 'test');
    await storage.remove(testKey);
    serviceStatus.storage = { available: true };
  } catch (error) {
    serviceStatus.storage = { available: false, error: String(error) };
  }

  // Check database
  try {
    const profileService = services.dataService('Profile');
    const count = await profileService.count({});
    serviceStatus.database = { available: count.isOk() };
  } catch (error) {
    serviceStatus.database = { available: false, error: String(error) };
  }

  // Check AI (if configured)
  if (services.has('coach')) {
    try {
      const coach = services.coach;
      const configured = coach.isConfigured ? coach.isConfigured() : true;
      serviceStatus.ai = { available: configured };
    } catch (error) {
      serviceStatus.ai = { available: false, error: String(error) };
    }
  }

  const healthy = Object.values(serviceStatus).every(s => s.available);

  return {
    healthy,
    services: serviceStatus,
  };
}