/**
 * Integration test examples for analytics
 * These show how analytics would be used in real app scenarios
 */

import { trackEvent, getAnalytics } from '../index';
import { trackBounceTaskComplete, trackCoachInteraction, trackJobApplication } from '../examples';

describe('Analytics Integration Examples', () => {
  describe('User Journey - First Day', () => {
    it('tracks complete onboarding and first task flow', () => {
      // User completes onboarding
      trackEvent('user_signed_up', { method: 'email' });
      
      // User opens app next day
      trackEvent('app_initialized', {});
      
      // User completes first bounce plan task
      trackBounceTaskComplete('day-1-task', 0, false);
      
      // User interacts with coach
      trackCoachInteraction('hype');
      
      // This would track day-2 activation automatically
    });
  });

  describe('Job Search Flow', () => {
    it('tracks job application pipeline', () => {
      // User adds initial application
      trackJobApplication('applied');
      
      // User moves to interview stage
      trackJobApplication('interviewing');
      
      // User receives offer
      trackJobApplication('offer');
    });
  });

  describe('Privacy Controls', () => {
    it('respects user privacy preferences', async () => {
      const analytics = getAnalytics();
      
      // User opts out
      await analytics.optOut();
      
      // Events should not be tracked
      trackEvent('task_completed', {
        task_id: 'test',
        day_index: 1,
        skipped: false
      });
      
      // User can opt back in
      await analytics.optIn();
    });
  });

  describe('Success Metrics', () => {
    it('tracks key business metrics', () => {
      const analytics = getAnalytics();
      
      // Day 2 activation
      analytics.trackActivation('day_2');
      
      // Interview progress
      analytics.trackInterviewProgress({
        days_since_signup: 25,
        interview_logged: true
      });
      
      // Coach satisfaction
      analytics.trackCoachRating({
        rating: 4.5,
        session_id: 'session-123'
      });
      
      // Pro conversion
      analytics.trackConversion({
        from_tier: 'free',
        to_tier: 'pro',
        days_since_signup: 15
      });
    });
  });
});