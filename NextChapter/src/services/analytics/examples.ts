/**
 * Analytics integration examples for Next Chapter app
 * These examples show how to properly track events throughout the app
 */

import { trackEvent, getAnalytics } from '@services/analytics/index';
import { shouldTrackFeature } from '@services/analytics/config';

// ========================================
// ONBOARDING FLOW
// ========================================

/**
 * Track when user completes onboarding
 */
export function trackOnboardingComplete() {
  trackEvent('user_signed_up', { method: 'email' });
  
  // Set user properties after onboarding
  const analytics = getAnalytics();
  analytics.setUserProperties({
    onboarding_completed: true,
    tier: 'free',
  });
}

// ========================================
// BOUNCE PLAN TRACKING
// ========================================

/**
 * Track task completion in the Bounce Plan
 */
export function trackBounceTaskComplete(taskId: string, dayIndex: number, skipped = false) {
  trackEvent('task_completed', {
    task_id: taskId,
    day_index: dayIndex,
    skipped,
  });
  
  // Track success metrics
  if (!skipped && dayIndex === 1) {
    // Day 2 activation
    const analytics = getAnalytics();
    analytics.trackActivation('day_2');
  }
}

// ========================================
// AI COACH TRACKING
// ========================================

/**
 * Track coach interactions with tone detection
 */
export function trackCoachInteraction(detectedTone?: 'hype' | 'pragmatist' | 'tough-love') {
  if (shouldTrackFeature('TRACK_COACH_TONE')) {
    trackEvent('coach_message_sent', {
      mode: 'pull',
      tone: detectedTone,
    });
  }
}

/**
 * Track coach satisfaction rating
 */
export function trackCoachRating(rating: number, sessionId: string) {
  const analytics = getAnalytics();
  analytics.trackCoachRating({
    rating,
    session_id: sessionId,
  });
}

// ========================================
// JOB TRACKER
// ========================================

/**
 * Track when user adds a job application
 */
export function trackJobApplication(stage: 'applied' | 'interviewing' | 'offer') {
  trackEvent('application_added', { stage });
  
  // Track interview progress
  if (stage === 'interviewing') {
    const analytics = getAnalytics();
    // Calculate days since signup (example)
    const daysSinceSignup = 30; // This would be calculated from actual data
    
    analytics.trackInterviewProgress({
      days_since_signup: daysSinceSignup,
      interview_logged: true,
    });
  }
}

// ========================================
// MOOD TRACKING
// ========================================

/**
 * Track daily mood check-in
 */
export function trackMoodEntry(emoji: string, valenceScore: number) {
  // Normalize valence score to -1 to 1 range
  const normalizedScore = Math.max(-1, Math.min(1, valenceScore));
  
  trackEvent('mood_logged', {
    emoji,
    valence_score: normalizedScore,
  });
}

// ========================================
// BUDGET TRACKER
// ========================================

/**
 * Track budget saving (with privacy protection)
 */
export function trackBudgetUpdate(income: number, expenses: number, runwayMonths: number) {
  if (shouldTrackFeature('TRACK_BUDGET_ANALYTICS')) {
    trackEvent('budget_saved', {
      income, // Will be hashed automatically
      expenses, // Will be hashed automatically
      runway_months: runwayMonths,
    });
  }
}

// ========================================
// RESUME SCANNER
// ========================================

/**
 * Track resume upload and analysis
 */
export function trackResumeAnalysis(keywordsMatched: number, suggestedKeywords: number) {
  if (shouldTrackFeature('TRACK_RESUME_SCANNER')) {
    trackEvent('resume_uploaded', {
      keywords_matched: keywordsMatched,
      suggested: suggestedKeywords,
    });
  }
}

// ========================================
// USER PROPERTIES
// ========================================

/**
 * Update user properties after layoff info collection
 */
export function updateUserLayoffInfo(industry: string, state: string, daysSinceLayoff: number) {
  const analytics = getAnalytics();
  analytics.setUserProperties({
    industry,
    location_state: state,
    days_since_layoff: daysSinceLayoff,
  });
}

// ========================================
// CONVERSION TRACKING
// ========================================

/**
 * Track when user upgrades to Pro
 */
export function trackProUpgrade(daysSinceSignup: number) {
  const analytics = getAnalytics();
  analytics.trackConversion({
    from_tier: 'free',
    to_tier: 'pro',
    days_since_signup: daysSinceSignup,
  });
  
  // Update user properties
  analytics.setUserProperties({
    tier: 'pro',
  });
}

// ========================================
// PRIVACY CONTROLS
// ========================================

/**
 * Handle user opting out of analytics
 */
export async function handleAnalyticsOptOut() {
  const analytics = getAnalytics();
  await analytics.optOut();
}

/**
 * Handle user opting back in to analytics
 */
export async function handleAnalyticsOptIn() {
  const analytics = getAnalytics();
  await analytics.optIn();
}

/**
 * Handle GDPR/CCPA data deletion request
 */
export async function handleDataDeletionRequest() {
  const analytics = getAnalytics();
  await analytics.deleteAllData();
}