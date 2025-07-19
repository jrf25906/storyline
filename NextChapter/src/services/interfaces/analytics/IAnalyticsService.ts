/**
 * Analytics service interface
 */

import { Result } from '@services/interfaces/common/result';

export interface IAnalyticsService {
  // Initialization
  initialize(config: AnalyticsConfig): Promise<Result<void>>;
  isInitialized(): boolean;
  
  // Event tracking
  track(event: string, properties?: Record<string, any>): void;
  trackError(error: Error, properties?: Record<string, any>): void;
  
  // Screen tracking
  trackScreen(screenName: string, properties?: Record<string, any>): void;
  
  // User identification
  identify(userId: string, traits?: Record<string, any>): void;
  alias(newId: string): void;
  reset(): void;
  
  // User properties
  setUserProperty(key: string, value: any): void;
  setUserProperties(properties: Record<string, any>): void;
  incrementUserProperty(key: string, by?: number): void;
  
  // Session management
  startSession(): void;
  endSession(): void;
  getSessionId(): string;
  
  // Privacy controls
  optIn(): Promise<Result<void>>;
  optOut(): Promise<Result<void>>;
  isOptedOut(): Promise<Result<boolean>>;
  deleteAllData(): Promise<Result<void>>;
  
  // Flushing
  flush(): Promise<Result<void>>;
  
  // Debug mode
  setDebugMode(enabled: boolean): void;
  
  // Revenue tracking
  trackRevenue(revenue: RevenueEvent): void;
}

export interface AnalyticsConfig {
  apiKey: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
  enableInDevelopment?: boolean;
  defaultProperties?: Record<string, any>;
  sensitiveProperties?: string[]; // Properties to exclude/hash
}

export interface RevenueEvent {
  amount: number;
  currency?: string;
  productId?: string;
  quantity?: number;
  properties?: Record<string, any>;
}

// Specialized event trackers
export interface IEventTracker {
  // User lifecycle
  trackSignUp(method: string, properties?: Record<string, any>): void;
  trackSignIn(method: string, properties?: Record<string, any>): void;
  trackSignOut(): void;
  
  // Feature usage
  trackFeatureUsed(feature: string, properties?: Record<string, any>): void;
  trackTaskCompleted(taskId: string, properties?: Record<string, any>): void;
  trackCoachInteraction(tone: string, properties?: Record<string, any>): void;
  
  // Business metrics
  trackInterviewScheduled(properties?: Record<string, any>): void;
  trackJobApplicationAdded(properties?: Record<string, any>): void;
  trackSubscriptionStarted(plan: string, properties?: Record<string, any>): void;
  
  // Engagement
  trackSessionDuration(seconds: number): void;
  trackDailyActive(): void;
  trackWeeklyActive(): void;
}

// Performance monitoring
export interface IPerformanceMonitor {
  // Timing
  startTimer(label: string): void;
  endTimer(label: string, metadata?: Record<string, any>): void;
  
  // Network
  trackApiCall(endpoint: string, duration: number, status: number): void;
  trackNetworkError(endpoint: string, error: Error): void;
  
  // App performance
  trackAppStart(duration: number): void;
  trackScreenTransition(from: string, to: string, duration: number): void;
  trackMemoryWarning(): void;
  trackCrash(error: Error): void;
}

// A/B testing
export interface IExperimentService {
  getVariant(experimentKey: string): Promise<Result<string>>;
  getVariantWithDefault(experimentKey: string, defaultValue: string): string;
  trackExperimentViewed(experimentKey: string, variant: string): void;
  trackExperimentConverted(experimentKey: string, variant: string): void;
  getAllActiveExperiments(): Promise<Result<Experiment[]>>;
}

export interface Experiment {
  key: string;
  name: string;
  variants: string[];
  isActive: boolean;
}