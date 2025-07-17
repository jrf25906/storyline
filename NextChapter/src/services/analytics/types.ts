/**
 * Analytics event definitions for Next Chapter app
 * Privacy-first: No PII should be included in events
 */

export interface AnalyticsEvents {
  // Core user journey events
  user_signed_up: {
    method: 'email';
  };
  
  user_signed_in: {
    method: 'email';
  };
  
  user_signed_out: Record<string, never>;
  
  password_reset_requested: {
    email: string;
  };
  
  app_initialized: Record<string, never>;
  
  // Bounce plan engagement
  task_completed: {
    task_id: string;
    day_index: number;
    skipped: boolean;
  };
  
  // AI coach usage
  coach_message_sent: {
    mode: 'pull';
    tone?: 'hype' | 'pragmatist' | 'tough-love';
  };
  
  // Resume feature adoption
  resume_uploaded: {
    keywords_matched: number;
    suggested: number;
  };
  
  // Job search activity
  application_added: {
    stage: 'applied' | 'interviewing' | 'offer';
  };
  
  // Emotional tracking
  mood_logged: {
    emoji: string;
    valence_score: number; // -1 to 1, normalized
  };
  
  // Financial planning (hashed data)
  budget_saved: {
    income: number; // Will be hashed before sending
    expenses: number; // Will be hashed before sending
    runway_months: number; // Safe to track
  };
}

// Success metric events
export interface SuccessMetricEvents {
  activation: {
    type: 'day_2';
  };
  
  interview_progress: {
    days_since_signup: number;
    interview_logged: boolean;
  };
  
  coach_rating: {
    rating: number; // 1-5 scale
    session_id: string;
  };
  
  tier_conversion: {
    from_tier: 'free' | 'pro';
    to_tier: 'free' | 'pro';
    days_since_signup: number;
  };
}

// User properties (no PII)
export interface UserProperties {
  industry?: string;
  location_state?: string;
  days_since_layoff?: number;
  onboarding_completed?: boolean;
  tier?: 'free' | 'pro';
}

// Queued event structure for offline support
export interface QueuedAnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

// Analytics configuration
export interface AnalyticsConfig {
  apiKey: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
  maxQueueSize?: number;
  debugMode?: boolean;
}