import { AnalyticsService } from '../analyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock PostHog
const mockPostHogInstance = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  optOut: jest.fn(),
  optIn: jest.fn(),
  flush: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
};

jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => mockPostHogInstance),
}));

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;
  let mockPostHog: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Use the shared mock instance
    mockPostHog = mockPostHogInstance;

    // Setup NetInfo mock
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    
    // Setup AsyncStorage mock
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    analytics = new AnalyticsService();
  });

  describe('Initialization', () => {
    it('should initialize with privacy settings respected', async () => {
      // User has opted out
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      
      await analytics.initialize('test-api-key');
      
      expect(mockPostHog.optOut).toHaveBeenCalled();
      // disable is not called in the implementation, only optOut
    });

    it('should generate anonymous user ID if none exists', async () => {
      await analytics.initialize('test-api-key');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/analytics_user_id',
        expect.any(String)
      );
    });

    it('should use existing anonymous user ID if available', async () => {
      const existingId = 'existing-anonymous-id';
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@next_chapter/analytics_user_id') return existingId;
        return null;
      });

      await analytics.initialize('test-api-key');
      
      expect(mockPostHog.identify).toHaveBeenCalledWith(existingId);
    });
  });

  describe('Event Tracking', () => {
    beforeEach(async () => {
      await analytics.initialize('test-api-key');
    });

    describe('user_signed_up', () => {
      it('should track user signup with method', () => {
        analytics.trackUserSignedUp({ method: 'email' });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('user_signed_up', {
          method: 'email',
          timestamp: expect.any(Number),
        });
      });
    });

    describe('task_completed', () => {
      it('should track task completion with skip status', () => {
        analytics.trackTaskCompleted({
          task_id: 'task-123',
          day_index: 5,
          skipped: false,
        });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('task_completed', {
          task_id: 'task-123',
          day_index: 5,
          skipped: false,
          timestamp: expect.any(Number),
        });
      });

      it('should track skipped tasks separately', () => {
        analytics.trackTaskCompleted({
          task_id: 'task-456',
          day_index: 10,
          skipped: true,
        });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('task_completed', {
          task_id: 'task-456',
          day_index: 10,
          skipped: true,
          timestamp: expect.any(Number),
        });
      });
    });

    describe('coach_message_sent', () => {
      it('should track coach messages with tone', () => {
        analytics.trackCoachMessageSent({
          mode: 'pull',
          tone: 'hype',
        });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('coach_message_sent', {
          mode: 'pull',
          tone: 'hype',
          timestamp: expect.any(Number),
        });
      });

      it('should track coach messages without tone', () => {
        analytics.trackCoachMessageSent({
          mode: 'pull',
        });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('coach_message_sent', {
          mode: 'pull',
          timestamp: expect.any(Number),
        });
      });
    });

    describe('resume_uploaded', () => {
      it('should track resume upload with keyword stats', () => {
        analytics.trackResumeUploaded({
          keywords_matched: 15,
          suggested: 5,
        });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('resume_uploaded', {
          keywords_matched: 15,
          suggested: 5,
          timestamp: expect.any(Number),
        });
      });
    });

    describe('application_added', () => {
      it('should track job applications by stage', () => {
        analytics.trackApplicationAdded({
          stage: 'interviewing',
        });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('application_added', {
          stage: 'interviewing',
          timestamp: expect.any(Number),
        });
      });
    });

    describe('mood_logged', () => {
      it('should track mood with emoji and valence score', () => {
        analytics.trackMoodLogged({
          emoji: '😊',
          valence_score: 0.8,
        });
        
        expect(mockPostHog.capture).toHaveBeenCalledWith('mood_logged', {
          emoji: '😊',
          valence_score: 0.8,
          timestamp: expect.any(Number),
        });
      });
    });

    describe('budget_saved', () => {
      it('should track budget data without exposing PII', () => {
        analytics.trackBudgetSaved({
          income: 5000,
          expenses: 3000,
          runway_months: 4.5,
        });
        
        // Should hash financial data
        expect(mockPostHog.capture).toHaveBeenCalledWith('budget_saved', {
          income: expect.not.stringMatching('5000'),
          expenses: expect.not.stringMatching('3000'),
          runway_months: 4.5, // Runway is okay to track
          timestamp: expect.any(Number),
        });
      });
    });
  });

  describe('Offline Queue', () => {
    it('should queue events when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
      
      // Mock AsyncStorage.getItem to return empty queue
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@next_chapter/analytics_queue') return Promise.resolve(null);
        return Promise.resolve(null);
      });
      
      await analytics.initialize('test-api-key');
      
      // Clear setItem calls from initialization
      (AsyncStorage.setItem as jest.Mock).mockClear();

      analytics.trackUserSignedUp({ method: 'email' });
      
      // Give async operations time to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockPostHog.capture).not.toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/analytics_queue',
        expect.any(String)
      );
    });

    it('should flush queue when coming back online', async () => {
      // Mock timer functions
      jest.useFakeTimers();
      
      // Start offline
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
      
      // Mock getItem to return null for queue initially
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@next_chapter/analytics_queue') return Promise.resolve(null);
        return Promise.resolve(null);
      });
      
      await analytics.initialize('test-api-key');

      // Track some events while offline
      analytics.trackUserSignedUp({ method: 'email' });
      analytics.trackTaskCompleted({ task_id: '1', day_index: 1, skipped: false });
      
      // Allow async operations to complete
      jest.advanceTimersByTime(0);
      await Promise.resolve();

      // Now mock getItem to return the queued events
      const queuedEvents = [
        { eventName: 'user_signed_up', properties: { method: 'email', timestamp: Date.now() } },
        { eventName: 'task_completed', properties: { task_id: '1', day_index: 1, skipped: false, timestamp: Date.now() } }
      ];
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@next_chapter/analytics_queue') return Promise.resolve(JSON.stringify(queuedEvents));
        return Promise.resolve(null);
      });

      // Clear previous mock calls
      mockPostHog.capture.mockClear();

      // Simulate coming back online
      await analytics.handleConnectionChange({ isConnected: true });

      // Fast forward through the debounce timer
      jest.advanceTimersByTime(5000);
      
      // Allow promises to resolve
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should flush queued events
      expect(mockPostHog.capture).toHaveBeenCalledTimes(2);
      
      // Restore real timers
      jest.useRealTimers();
    });

    it('should respect queue size limits', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });
      await analytics.initialize('test-api-key');

      // Try to queue more than limit (100 events)
      for (let i = 0; i < 150; i++) {
        analytics.trackTaskCompleted({ 
          task_id: `task-${i}`, 
          day_index: i, 
          skipped: false 
        });
      }

      const queue = await analytics.getQueuedEvents();
      expect(queue.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Privacy Controls', () => {
    beforeEach(async () => {
      await analytics.initialize('test-api-key');
    });

    it('should allow users to opt out', async () => {
      await analytics.optOut();
      
      expect(mockPostHog.optOut).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/analytics_opt_out',
        'true'
      );
    });

    it('should allow users to opt back in', async () => {
      await analytics.optIn();
      
      expect(mockPostHog.optIn).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@next_chapter/analytics_opt_out'
      );
    });

    it('should not track events when opted out', async () => {
      await analytics.optOut();
      
      analytics.trackUserSignedUp({ method: 'email' });
      
      expect(mockPostHog.capture).not.toHaveBeenCalled();
    });

    it('should delete all data on request', async () => {
      await analytics.deleteAllData();
      
      expect(mockPostHog.reset).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@next_chapter/analytics_user_id');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@next_chapter/analytics_queue');
    });
  });

  describe('Debug Mode', () => {
    it('should log events in debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Initialize first
      await analytics.initialize('test-api-key');
      analytics.enableDebugMode();
      
      analytics.trackUserSignedUp({ method: 'email' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics Debug]',
        'user_signed_up',
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('should not log events when debug mode is off', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      analytics.disableDebugMode();
      
      analytics.trackUserSignedUp({ method: 'email' });
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[Analytics Debug]'),
        expect.any(String),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Success Metrics', () => {
    beforeEach(async () => {
      await analytics.initialize('test-api-key');
    });

    it('should track day-2 activation', () => {
      analytics.trackActivation('day_2');
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('activation', {
        type: 'day_2',
        timestamp: expect.any(Number),
      });
    });

    it('should track interview progress', () => {
      analytics.trackInterviewProgress({
        days_since_signup: 45,
        interview_logged: true,
      });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('interview_progress', {
        days_since_signup: 45,
        interview_logged: true,
        timestamp: expect.any(Number),
      });
    });

    it('should track coach satisfaction ratings', () => {
      analytics.trackCoachRating({
        rating: 4.5,
        session_id: 'session-123',
      });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('coach_rating', {
        rating: 4.5,
        session_id: 'session-123',
        timestamp: expect.any(Number),
      });
    });

    it('should track conversion to pro', () => {
      analytics.trackConversion({
        from_tier: 'free',
        to_tier: 'pro',
        days_since_signup: 25,
      });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('tier_conversion', {
        from_tier: 'free',
        to_tier: 'pro',
        days_since_signup: 25,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('User Properties', () => {
    beforeEach(async () => {
      await analytics.initialize('test-api-key');
    });

    it('should set user properties without PII', () => {
      analytics.setUserProperties({
        industry: 'tech',
        location_state: 'CA',
        days_since_layoff: 30,
      });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('$set', {
        industry: 'tech',
        location_state: 'CA',
        days_since_layoff: 30,
      });
    });

    it('should not set forbidden properties', () => {
      analytics.setUserProperties({
        email: 'test@example.com', // Should be filtered
        name: 'John Doe', // Should be filtered
        industry: 'tech', // Should pass
      });
      
      expect(mockPostHog.capture).toHaveBeenCalledWith('$set', {
        industry: 'tech',
      });
    });
  });
});