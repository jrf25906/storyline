import { getSecurityServices } from '@services/security';
import { Alert } from 'react-native';
import { setupAnalytics } from '@services/analytics/config';
import { trackEvent } from '@services/analytics';

/**
 * Initialize all app services with proper error handling
 * This should be called during app startup
 */
export async function initializeAppServices(): Promise<boolean> {
  try {
    console.log('Initializing app services...');
    
    const services = getSecurityServices();
    
    // Initialize environment and security services
    await services.initialize();
    
    // Validate all services
    const validation = await services.validate();
    
    if (!validation.environment) {
      throw new Error('Environment configuration is invalid');
    }
    
    if (!validation.supabase) {
      throw new Error('Supabase configuration is invalid');
    }
    
    if (!validation.openai) {
      throw new Error('OpenAI configuration is invalid');
    }
    
    if (!validation.rowLevelSecurity) {
      console.warn('Row Level Security is not properly configured on all tables');
      // In production, this should be a hard failure
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Row Level Security must be enabled in production');
      }
    }
    
    // Initialize analytics service
    try {
      await setupAnalytics();
      
      // Track app initialization
      trackEvent('app_initialized', {});
    } catch (analyticsError) {
      // Analytics failure should not prevent app from working
      console.warn('Analytics initialization failed:', analyticsError);
    }
    
    console.log('All services initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize app services:', error);
    
    // Show user-friendly error message
    Alert.alert(
      'Configuration Error',
      'The app is not properly configured. Please check your environment settings.',
      [
        {
          text: 'OK',
          onPress: () => {
            // In production, you might want to redirect to a setup screen
            console.log('User acknowledged configuration error');
          },
        },
      ]
    );
    
    return false;
  }
}

/**
 * Setup secure credentials (for first-time setup or credential updates)
 */
export async function setupSecureCredentials(
  supabaseUrl: string,
  supabaseAnonKey: string,
  openAIApiKey: string
): Promise<boolean> {
  try {
    const services = getSecurityServices();
    
    await services.environment.setCredentials({
      supabaseUrl,
      supabaseAnonKey,
      openAIApiKey,
    });
    
    // Re-initialize services with new credentials
    await services.initialize();
    
    // Validate the new configuration
    const validation = await services.validate();
    
    return (
      validation.environment &&
      validation.supabase &&
      validation.openai
    );
  } catch (error) {
    console.error('Failed to setup credentials:', error);
    return false;
  }
}

/**
 * Clear all stored credentials (for logout or app reset)
 */
export async function clearStoredCredentials(): Promise<void> {
  try {
    const services = getSecurityServices();
    await services.environment.clearCredentials();
    
    // Also clear analytics data if user is logging out
    const { getAnalytics } = await import('./analytics');
    const analytics = getAnalytics();
    await analytics.deleteAllData();
    
    console.log('Credentials and analytics data cleared successfully');
  } catch (error) {
    console.error('Failed to clear credentials:', error);
    throw error;
  }
}