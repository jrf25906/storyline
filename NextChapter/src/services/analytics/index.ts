import { AnalyticsService } from './analyticsService';
import { AnalyticsEvents } from './types';

// Singleton instance
let analyticsInstance: AnalyticsService | null = null;

/**
 * Get or create the analytics service instance
 */
export function getAnalytics(): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService();
  }
  return analyticsInstance;
}

/**
 * Initialize analytics with PostHog API key
 */
export async function initializeAnalytics(apiKey: string): Promise<void> {
  const analytics = getAnalytics();
  await analytics.initialize(apiKey);
}

/**
 * Helper function to track events with type safety
 */
export function trackEvent<T extends keyof AnalyticsEvents>(
  event: T,
  properties: AnalyticsEvents[T]
): void {
  const analytics = getAnalytics();
  
  switch (event) {
    case 'user_signed_up':
      analytics.trackUserSignedUp(properties as AnalyticsEvents['user_signed_up']);
      break;
    case 'user_signed_in':
      analytics.trackUserSignedIn(properties as AnalyticsEvents['user_signed_in']);
      break;
    case 'user_signed_out':
      analytics.trackUserSignedOut();
      break;
    case 'app_initialized':
      analytics.trackAppInitialized();
      break;
    case 'task_completed':
      analytics.trackTaskCompleted(properties as AnalyticsEvents['task_completed']);
      break;
    case 'coach_message_sent':
      analytics.trackCoachMessageSent(properties as AnalyticsEvents['coach_message_sent']);
      break;
    case 'resume_uploaded':
      analytics.trackResumeUploaded(properties as AnalyticsEvents['resume_uploaded']);
      break;
    case 'application_added':
      analytics.trackApplicationAdded(properties as AnalyticsEvents['application_added']);
      break;
    case 'mood_logged':
      analytics.trackMoodLogged(properties as AnalyticsEvents['mood_logged']);
      break;
    case 'budget_saved':
      analytics.trackBudgetSaved(properties as AnalyticsEvents['budget_saved']);
      break;
  }
}

// Export types
export * from './types';
export { AnalyticsService } from './analyticsService';