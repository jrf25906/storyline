import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { PostHog } from 'posthog-react-native';
import uuid from 'react-native-uuid';
import {
  AnalyticsEvents,
  SuccessMetricEvents,
  UserProperties,
  QueuedAnalyticsEvent,
  AnalyticsConfig,
} from './types';
import { hashFinancialData } from './utils';

const STORAGE_KEYS = {
  USER_ID: '@next_chapter/analytics_user_id',
  OPT_OUT: '@next_chapter/analytics_opt_out',
  QUEUE: '@next_chapter/analytics_queue',
} as const;

const FORBIDDEN_PROPERTIES = ['email', 'name', 'phone', 'address', 'ssn'];
const MAX_QUEUE_SIZE = 100;
const QUEUE_FLUSH_DELAY = 5000; // 5 seconds

export class AnalyticsService {
  private posthog: PostHog | null = null;
  private isInitialized = false;
  private isOptedOut = false;
  private isOnline = true;
  private debugMode = false;
  private userId: string | null = null;
  private queueFlushTimeout: NodeJS.Timeout | null = null;

  async initialize(apiKey: string, config?: Partial<AnalyticsConfig>) {
    try {
      // Check opt-out status
      const optOutStatus = await AsyncStorage.getItem(STORAGE_KEYS.OPT_OUT);
      this.isOptedOut = optOutStatus === 'true';

      // Get or create anonymous user ID
      this.userId = await this.getOrCreateUserId();

      // Initialize PostHog
      this.posthog = new PostHog(apiKey, {
        host: config?.host || 'https://app.posthog.com',
        flushAt: config?.flushAt || 20,
        flushInterval: config?.flushInterval || 10000,
        ...config,
      });

      // Identify user
      if (this.userId) {
        this.posthog.identify(this.userId);
      }

      // Apply opt-out if needed
      if (this.isOptedOut) {
        this.posthog.optOut();
      }

      // Check connection status
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected || false;

      // Setup connection listener
      NetInfo.addEventListener((state) => {
        this.handleConnectionChange(state);
      });

      // Flush any queued events
      if (this.isOnline && !this.isOptedOut) {
        await this.flushQueue();
      }

      this.isInitialized = true;
      this.debugLog('Analytics initialized', { userId: this.userId, optedOut: this.isOptedOut });
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  // Core event tracking methods
  trackUserSignedUp(properties: AnalyticsEvents['user_signed_up']) {
    this.track('user_signed_up', properties);
  }

  trackUserSignedIn(properties: AnalyticsEvents['user_signed_in']) {
    this.track('user_signed_in', properties);
  }

  trackUserSignedOut() {
    this.track('user_signed_out', {});
  }

  trackAppInitialized() {
    this.track('app_initialized', {});
  }

  trackTaskCompleted(properties: AnalyticsEvents['task_completed']) {
    this.track('task_completed', properties);
  }

  trackCoachMessageSent(properties: AnalyticsEvents['coach_message_sent']) {
    this.track('coach_message_sent', properties);
  }

  trackResumeUploaded(properties: AnalyticsEvents['resume_uploaded']) {
    this.track('resume_uploaded', properties);
  }

  trackApplicationAdded(properties: AnalyticsEvents['application_added']) {
    this.track('application_added', properties);
  }

  trackMoodLogged(properties: AnalyticsEvents['mood_logged']) {
    this.track('mood_logged', properties);
  }

  trackBudgetSaved(properties: AnalyticsEvents['budget_saved']) {
    // Hash financial data for privacy
    const hashedProps = {
      income: hashFinancialData(properties.income),
      expenses: hashFinancialData(properties.expenses),
      runway_months: properties.runway_months,
    };
    this.track('budget_saved', hashedProps);
  }

  // Success metric tracking
  trackActivation(type: 'day_2') {
    this.track('activation', { type });
  }

  trackInterviewProgress(properties: SuccessMetricEvents['interview_progress']) {
    this.track('interview_progress', properties);
  }

  trackCoachRating(properties: SuccessMetricEvents['coach_rating']) {
    this.track('coach_rating', properties);
  }

  trackConversion(properties: SuccessMetricEvents['tier_conversion']) {
    this.track('tier_conversion', properties);
  }

  // User property management
  setUserProperties(properties: UserProperties) {
    if (!this.isInitialized || this.isOptedOut) return;

    // Filter out any forbidden properties
    const filteredProps = Object.entries(properties).reduce((acc, [key, value]) => {
      if (!FORBIDDEN_PROPERTIES.includes(key.toLowerCase())) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    this.posthog?.capture('$set', filteredProps);
    this.debugLog('User properties set', filteredProps);
  }

  // Privacy controls
  async optOut() {
    this.isOptedOut = true;
    await AsyncStorage.setItem(STORAGE_KEYS.OPT_OUT, 'true');
    this.posthog?.optOut();
    this.debugLog('User opted out of analytics');
  }

  async optIn() {
    this.isOptedOut = false;
    await AsyncStorage.removeItem(STORAGE_KEYS.OPT_OUT);
    this.posthog?.optIn();
    this.debugLog('User opted in to analytics');
  }

  async deleteAllData() {
    // Reset PostHog
    this.posthog?.reset();

    // Clear all stored data
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.QUEUE);
    
    this.userId = null;
    this.debugLog('All analytics data deleted');
  }

  // Debug mode
  enableDebugMode() {
    this.debugMode = true;
  }

  disableDebugMode() {
    this.debugMode = false;
  }

  // Private methods
  private track(eventName: string, properties: Record<string, any>) {
    if (!this.isInitialized || this.isOptedOut) return;

    const enrichedProps = {
      ...properties,
      timestamp: Date.now(),
    };

    this.debugLog(eventName, enrichedProps);

    if (this.isOnline && this.posthog) {
      this.posthog.capture(eventName, enrichedProps);
    } else {
      this.queueEvent(eventName, enrichedProps);
    }
  }

  private async queueEvent(eventName: string, properties: Record<string, any>) {
    try {
      const queue = await this.getQueuedEvents();
      
      // Respect queue size limit
      if (queue.length >= MAX_QUEUE_SIZE) {
        // Remove oldest event
        queue.shift();
      }

      queue.push({
        eventName,
        properties,
        timestamp: Date.now(),
        retryCount: 0,
      });

      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
      this.debugLog('Event queued', { eventName, queueSize: queue.length });
    } catch (error) {
      console.error('Failed to queue event:', error);
    }
  }

  async getQueuedEvents(): Promise<QueuedAnalyticsEvent[]> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.QUEUE);
      return queueData ? JSON.parse(queueData) : [];
    } catch {
      return [];
    }
  }

  private async flushQueue() {
    if (!this.isOnline || this.isOptedOut || !this.posthog) return;

    try {
      const queue = await this.getQueuedEvents();
      if (queue.length === 0) return;

      this.debugLog('Flushing queue', { count: queue.length });

      // Send all queued events
      for (const event of queue) {
        this.posthog.capture(event.eventName, event.properties);
      }

      // Clear queue
      await AsyncStorage.removeItem(STORAGE_KEYS.QUEUE);
      
      // Force flush to send immediately
      this.posthog.flush();
    } catch (error) {
      console.error('Failed to flush queue:', error);
    }
  }

  async handleConnectionChange(state: { isConnected: boolean | null }) {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected || false;

    if (wasOffline && this.isOnline) {
      // Debounce queue flush
      if (this.queueFlushTimeout) {
        clearTimeout(this.queueFlushTimeout);
      }

      this.queueFlushTimeout = setTimeout(() => {
        this.flushQueue();
      }, QUEUE_FLUSH_DELAY) as unknown as NodeJS.Timeout;
    }
  }

  private async getOrCreateUserId(): Promise<string> {
    try {
      let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      
      if (!userId) {
        userId = uuid.v4() as string;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      }
      
      return userId;
    } catch (error) {
      console.error('Failed to get/create user ID:', error);
      return uuid.v4() as string;
    }
  }


  private debugLog(message: string, data?: any) {
    if (this.debugMode) {
      console.log('[Analytics Debug]', message, data);
    }
  }
}