import { trackEvent, AnalyticsEvents } from '@/services/analytics';

/**
 * Legacy analytics function - forwards to new analytics service
 * @deprecated Use trackEvent from @/services/analytics instead
 */
export function logAnalyticsEvent<T extends keyof AnalyticsEvents>(
  event: T,
  properties: AnalyticsEvents[T]
) {
  // Forward to new analytics service
  trackEvent(event, properties);
}