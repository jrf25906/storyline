// Setup mocks before any imports
jest.mock('expo-notifications');
jest.mock('expo-device');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  NotificationService,
  NotificationPreferences,
  NotificationType,
} from '../notificationService';

// Get the mocked module
const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

// Add SchedulableTriggerInputTypes to the mock
(mockNotifications as any).SchedulableTriggerInputTypes = {
  CALENDAR: 'calendar',
  DATE: 'date',
  TIME_INTERVAL: 'timeInterval',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  YEARLY: 'yearly',
};

describe('NotificationService', () => {
  let notificationService: NotificationService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Device.isDevice as a property
    Object.defineProperty(Device, 'isDevice', {
      get: jest.fn(() => true),
      configurable: true,
    });
    
    // Default mocks
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    notificationService = new NotificationService();
  });

  describe('Permission Handling', () => {
    it('should request notification permissions', async () => {
      const mockPermission = {
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      };
      
      (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermission);
      (mockNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValue(mockPermission);
      
      const result = await notificationService.requestPermissions();
      
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle permission denial gracefully', async () => {
      const mockPermission = {
        status: 'denied',
        expires: 'never',
        granted: false,
        canAskAgain: false,
      };
      
      (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermission);
      (mockNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValue(mockPermission);
      
      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(false);
    });

    it('should check existing permissions before requesting', async () => {
      const mockPermission = {
        status: 'granted',
        expires: 'never',
        granted: true,
        canAskAgain: true,
      };
      
      (mockNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue(mockPermission);
      
      const result = await notificationService.requestPermissions();
      
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false on simulator', async () => {
      Object.defineProperty(Device, 'isDevice', {
        get: jest.fn(() => false),
        configurable: true,
      });
      
      const result = await notificationService.requestPermissions();
      
      expect(result).toBe(false);
      expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  describe('Push Token Registration', () => {
    it('should register and store push token', async () => {
      const mockToken = 'ExponentPushToken[abc123]';
      (mockNotifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockToken,
      });
      
      const token = await notificationService.registerForPushNotifications();
      
      expect(token).toBe(mockToken);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/push_token',
        mockToken
      );
    });

    it('should handle token registration errors', async () => {
      (mockNotifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      const token = await notificationService.registerForPushNotifications();
      
      expect(token).toBeNull();
    });
  });

  describe('Daily Task Reminders', () => {
    beforeEach(() => {
      const mockDate = new Date('2024-01-15T08:00:00');
      jest.useFakeTimers().setSystemTime(mockDate);
      
      // Mock getAllScheduledNotificationsAsync to return empty array by default
      (mockNotifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should schedule daily task reminder at 9am local time', async () => {
      await notificationService.scheduleDailyTaskReminder();
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: "Time for today's task! 💪",
          body: "Your 10-minute daily task is ready. You've got this!",
          data: { type: NotificationType.DAILY_TASK },
          sound: true,
        },
        trigger: {
          type: 'calendar',
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });
    });

    it('should cancel existing reminder before scheduling new one', async () => {
      const mockIdentifier = 'daily-task-123';
      (mockNotifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([
        {
          identifier: mockIdentifier,
          content: {
            data: { type: NotificationType.DAILY_TASK },
          },
          trigger: {},
        },
      ]);
      
      await notificationService.scheduleDailyTaskReminder();
      
      expect(mockNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        mockIdentifier
      );
    });

    it('should respect user preferences for daily reminders', async () => {
      const preferences: NotificationPreferences = {
        dailyTasks: false,
        jobFollowUps: true,
        budgetAlerts: true,
        moodCheckIns: true,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(preferences));
      
      await notificationService.scheduleDailyTaskReminder();
      
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Job Application Follow-ups', () => {
    it('should schedule follow-up reminder for job application', async () => {
      const applicationDate = new Date();
      const followUpDate = new Date(applicationDate);
      followUpDate.setDate(followUpDate.getDate() + 7); // 7 days later
      
      await notificationService.scheduleJobFollowUp({
        applicationId: 'job-123',
        companyName: 'TechCorp',
        position: 'Senior Developer',
        applicationDate,
      });
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Follow up with TechCorp',
          body: "It's been a week since you applied for Senior Developer. Time to follow up!",
          data: {
            type: NotificationType.JOB_FOLLOW_UP,
            applicationId: 'job-123',
          },
          sound: true,
        },
        trigger: {
          type: 'date',
          date: followUpDate,
        },
      });
    });

    it('should not schedule follow-up if preferences disabled', async () => {
      const preferences: NotificationPreferences = {
        dailyTasks: true,
        jobFollowUps: false,
        budgetAlerts: true,
        moodCheckIns: true,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(preferences));
      
      await notificationService.scheduleJobFollowUp({
        applicationId: 'job-123',
        companyName: 'TechCorp',
        position: 'Senior Developer',
        applicationDate: new Date(),
      });
      
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Budget Alerts', () => {
    beforeEach(() => {
      // Mock getItem to return null for last alert by default
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@next_chapter/last_budget_alert') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });
    });

    it('should trigger alert when runway drops below 60 days', async () => {
      await notificationService.checkBudgetRunway(45);
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Budget Alert',
          body: 'Your financial runway is down to 45 days. Time to review your budget plan.',
          data: { type: NotificationType.BUDGET_ALERT },
          sound: true,
        },
        trigger: null, // Immediate notification
      });
    });

    it('should not trigger alert if runway is healthy', async () => {
      await notificationService.checkBudgetRunway(90);
      
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should respect alert cooldown period', async () => {
      const lastAlertTime = new Date();
      lastAlertTime.setHours(lastAlertTime.getHours() - 12); // 12 hours ago
      
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@next_chapter/last_budget_alert') {
          return Promise.resolve(lastAlertTime.toISOString());
        }
        return Promise.resolve(null);
      });
      
      await notificationService.checkBudgetRunway(45);
      
      expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('Mood Check-in Reminders', () => {
    it('should schedule evening mood check-in', async () => {
      await notificationService.scheduleMoodCheckIn();
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'How are you feeling today?',
          body: 'Take a moment to log your mood. Tracking helps identify patterns.',
          data: { type: NotificationType.MOOD_CHECK_IN },
          sound: true,
        },
        trigger: {
          type: 'calendar',
          hour: 20, // 8 PM
          minute: 0,
          repeats: true,
        },
      });
    });
  });

  describe('Notification Preferences', () => {
    beforeEach(() => {
      // Mock cancelAllScheduledNotificationsAsync for updatePreferences
      (mockNotifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);
    });

    it('should save notification preferences', async () => {
      const preferences: NotificationPreferences = {
        dailyTasks: true,
        jobFollowUps: false,
        budgetAlerts: true,
        moodCheckIns: false,
        quietHoursStart: 21,
        quietHoursEnd: 9,
      };
      
      await notificationService.updatePreferences(preferences);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/notification_preferences',
        JSON.stringify(preferences)
      );
    });

    it('should load saved preferences', async () => {
      const savedPreferences: NotificationPreferences = {
        dailyTasks: false,
        jobFollowUps: true,
        budgetAlerts: true,
        moodCheckIns: true,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(savedPreferences)
      );
      
      const preferences = await notificationService.getPreferences();
      
      expect(preferences).toEqual(savedPreferences);
    });

    it('should return default preferences if none saved', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const preferences = await notificationService.getPreferences();
      
      expect(preferences).toEqual({
        dailyTasks: true,
        jobFollowUps: true,
        budgetAlerts: true,
        moodCheckIns: true,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      });
    });
  });

  describe('Do Not Disturb Scheduling', () => {
    it('should respect quiet hours for non-urgent notifications', async () => {
      const mockDate = new Date('2024-01-15T23:00:00'); // 11 PM
      jest.useFakeTimers().setSystemTime(mockDate);
      
      const preferences: NotificationPreferences = {
        dailyTasks: true,
        jobFollowUps: true,
        budgetAlerts: true,
        moodCheckIns: true,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(preferences));
      
      const shouldSend = await notificationService.shouldSendNotification(
        NotificationType.MOOD_CHECK_IN
      );
      
      expect(shouldSend).toBe(false);
      
      jest.useRealTimers();
    });

    it('should allow urgent notifications during quiet hours', async () => {
      const mockDate = new Date('2024-01-15T23:00:00'); // 11 PM
      jest.useFakeTimers().setSystemTime(mockDate);
      
      const preferences: NotificationPreferences = {
        dailyTasks: true,
        jobFollowUps: true,
        budgetAlerts: true,
        moodCheckIns: true,
        quietHoursStart: 22,
        quietHoursEnd: 8,
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(preferences));
      
      const shouldSend = await notificationService.shouldSendNotification(
        NotificationType.BUDGET_ALERT,
        true // urgent
      );
      
      expect(shouldSend).toBe(true);
      
      jest.useRealTimers();
    });
  });

  describe('Notification Handlers', () => {
    it('should handle notification response for daily task', async () => {
      const mockResponse = {
        notification: {
          request: {
            content: {
              data: { type: NotificationType.DAILY_TASK },
            },
          },
        },
        actionIdentifier: 'default',
      };
      
      const handler = jest.fn();
      notificationService.setNotificationHandler(NotificationType.DAILY_TASK, handler);
      
      await notificationService.handleNotificationResponse(mockResponse);
      
      expect(handler).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle foreground notifications appropriately', async () => {
      const mockNotification = {
        request: {
          content: {
            data: { type: NotificationType.DAILY_TASK },
          },
        },
      };
      
      const handler = notificationService.getForegroundNotificationHandler();
      const result = await handler(mockNotification);
      
      expect(result).toEqual({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      });
    });
  });

  describe('Local Notifications for Offline', () => {
    it('should use local notifications when offline', async () => {
      await notificationService.scheduleLocalNotification({
        title: 'Offline Reminder',
        body: 'This works even without internet!',
        trigger: { seconds: 60 },
      });
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Offline Reminder',
          body: 'This works even without internet!',
          sound: true,
        },
        trigger: { seconds: 60 },
      });
    });
  });

  describe('Deep Linking', () => {
    it('should include deep link data in notifications', async () => {
      await notificationService.scheduleNotificationWithDeepLink({
        title: 'Check your progress',
        body: 'See how far you\'ve come!',
        deepLink: 'nextchapter://bounce-plan/progress',
        trigger: null,
      });
      
      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Check your progress',
          body: 'See how far you\'ve come!',
          data: {
            deepLink: 'nextchapter://bounce-plan/progress',
          },
          sound: true,
        },
        trigger: null,
      });
    });
  });
});