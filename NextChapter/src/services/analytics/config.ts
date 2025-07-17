import { initializeAnalytics, getAnalytics } from './index';
import { KeychainService } from '@/services/security/keychain';

const keychainService = new KeychainService();

/**
 * Initialize analytics on app startup
 * This should be called early in the app initialization process
 */
export async function setupAnalytics() {
  try {
    // Get API key from secure storage or environment
    let apiKey = await keychainService.getSecureValue('posthog_api_key');
    
    if (!apiKey) {
      // Fallback to environment variable for development
      apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? null;
      
      if (!apiKey) {
        console.warn('PostHog API key not found. Analytics will be disabled.');
        return;
      }
    }

    // Initialize analytics
    await initializeAnalytics(apiKey);

    // Enable debug mode in development
    if (__DEV__) {
      const analytics = getAnalytics();
      analytics.enableDebugMode();
    }

    console.log('Analytics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

/**
 * Analytics feature flags
 */
export const ANALYTICS_FEATURES = {
  // Feature flags for gradual rollout
  TRACK_COACH_TONE: true,
  TRACK_RESUME_SCANNER: false, // Beta feature
  TRACK_PEER_CONNECT: false, // Invite-only
  TRACK_BUDGET_ANALYTICS: true, // Pro tier only
} as const;

/**
 * Check if a feature should be tracked
 */
export function shouldTrackFeature(feature: keyof typeof ANALYTICS_FEATURES): boolean {
  return ANALYTICS_FEATURES[feature];
}