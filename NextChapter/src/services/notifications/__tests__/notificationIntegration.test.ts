import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '@services/notifications/notificationService';
import { setupNotificationHandlers } from '@services/notifications/notificationHandlers';
import { NavigationContainerRef } from '@react-navigation/native';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Add SchedulableTriggerInputTypes to the expo-notifications mock
const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
(mockNotifications as any).SchedulableTriggerInputTypes = {
  CALENDAR: 'calendar',
  DATE: 'date',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  TIME_INTERVAL: 'timeInterval',
};

describe('Notification System Integration', () => {
  let navigationRef: React.RefObject<NavigationContainerRef<any>>;
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    navigationRef = {
      current: {
        navigate: mockNavigate,
      } as any,
    };

    // Setup default mocks
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      granted: true,
    });
  });

  describe('Complete User Journey', () => {
    it('should handle first-time user notification setup', async () => {
      // User opens app for first time
      const granted = await notificationService.requestPermissions();
      expect(granted).toBe(true);

      // Register for push notifications
      const mockToken = 'ExponentPushToken[abc123]';
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockToken,
      });
      
      const token = await notificationService.registerForPushNotifications();
      expect(token).toBe(mockToken);

      // Schedule initial notifications
      await notificationService.scheduleDailyTaskReminder();
      await notificationService.scheduleMoodCheckIn();

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    });

    it('should handle job application flow with follow-up', async () => {
      // User adds job application
      const application = {
        applicationId: 'job-123',
        companyName: 'Dream Company',
        position: 'Senior Developer',
        applicationDate: new Date(),
      };

      // Schedule follow-up reminder
      await notificationService.scheduleJobFollowUp(application);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Follow up with Dream Company',
          }),
        })
      );

      // Simulate notification tap
      const handlers = setupNotificationHandlers(navigationRef);
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: {
                type: 'JOB_FOLLOW_UP',
                applicationId: 'job-123',
              },
            },
          },
        },
      };

      handlers.handleNotificationResponse(mockResponse as any);

      expect(mockNavigate).toHaveBeenCalledWith('JobTracker', {
        screen: 'ApplicationDetail',
        params: { applicationId: 'job-123' },
      });
    });

    it('should handle budget alert flow', async () => {
      // Simulate low budget scenario
      await notificationService.checkBudgetRunway(45);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Budget Alert',
            body: expect.stringContaining('45 days'),
          }),
        })
      );

      // Ensure cooldown period works
      await notificationService.checkBudgetRunway(40);
      
      // Should not send another alert within 24 hours
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    });

    it('should respect quiet hours', async () => {
      // Set quiet hours
      const preferences = {
        dailyTasks: true,
        jobFollowUps: true,
        budgetAlerts: true,
        moodCheckIns: true,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      };

      await notificationService.updatePreferences(preferences);

      // Test during quiet hours (11 PM)
      const mockDate = new Date('2024-01-15T23:00:00');
      jest.useFakeTimers().setSystemTime(mockDate);

      const shouldSend = await notificationService.shouldSendNotification('MOOD_CHECK_IN' as any);
      expect(shouldSend).toBe(false);

      // Test urgent notification during quiet hours
      const shouldSendUrgent = await notificationService.shouldSendNotification('BUDGET_ALERT' as any, true);
      expect(shouldSendUrgent).toBe(true);

      jest.useRealTimers();
    });

    it('should handle preference changes', async () => {
      // User disables certain notifications
      const preferences = {
        dailyTasks: true,
        jobFollowUps: false,
        budgetAlerts: true,
        moodCheckIns: false,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      };

      await notificationService.updatePreferences(preferences);

      // Verify disabled notifications aren't scheduled
      const application = {
        applicationId: 'job-456',
        companyName: 'Another Company',
        position: 'Developer',
        applicationDate: new Date(),
      };

      await notificationService.scheduleJobFollowUp(application);
      
      // Should not schedule since jobFollowUps is disabled
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should handle deep links correctly', () => {
      const handlers = setupNotificationHandlers(navigationRef);
      
      // Test various deep links
      const testCases = [
        {
          deepLink: 'nextchapter://bounce-plan/progress',
          expectedNav: ['BouncePlan', { screen: 'Progress' }],
        },
        {
          deepLink: 'nextchapter://job-tracker',
          expectedNav: ['JobTracker'],
        },
        {
          deepLink: 'nextchapter://budget',
          expectedNav: ['Budget'],
        },
        {
          deepLink: 'nextchapter://mood',
          expectedNav: ['MoodTracker'],
        },
      ];

      testCases.forEach(({ deepLink, expectedNav }) => {
        mockNavigate.mockClear();
        
        const response = {
          notification: {
            request: {
              content: {
                data: { deepLink },
              },
            },
          },
        };

        handlers.handleNotificationResponse(response as any);
        expect(mockNavigate).toHaveBeenCalledWith(...expectedNav);
      });
    });

    it('should handle offline notification scheduling', async () => {
      // Schedule local notification for offline reminder
      await notificationService.scheduleLocalNotification({
        title: 'Complete your daily task',
        body: 'Even offline, we\'re here to support you!',
        trigger: { seconds: 3600 }, // 1 hour
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Complete your daily task',
          }),
          trigger: { seconds: 3600 },
        })
      );
    });

    it('should handle notification permission denial gracefully', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        granted: false,
      });

      const granted = await notificationService.requestPermissions();
      expect(granted).toBe(false);

      // App should still function without notifications
      await notificationService.scheduleDailyTaskReminder();
      
      // Should not attempt to schedule if permissions denied
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle notification scheduling errors', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Scheduling failed')
      );

      // Should not throw, just log error
      await expect(
        notificationService.scheduleDailyTaskReminder()
      ).resolves.not.toThrow();
    });

    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage full')
      );

      // Should not throw when saving preferences fails
      await expect(
        notificationService.updatePreferences({
          dailyTasks: true,
          jobFollowUps: true,
          budgetAlerts: true,
          moodCheckIns: true,
          quietHoursStart: 22,
          quietHoursEnd: 8,
        })
      ).resolves.not.toThrow();
    });
  });
});