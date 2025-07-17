import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export enum NotificationType {
  DAILY_TASK = 'DAILY_TASK',
  JOB_FOLLOW_UP = 'JOB_FOLLOW_UP',
  BUDGET_ALERT = 'BUDGET_ALERT',
  MOOD_CHECK_IN = 'MOOD_CHECK_IN',
}

export interface NotificationPreferences {
  dailyTasks: boolean;
  jobFollowUps: boolean;
  budgetAlerts: boolean;
  moodCheckIns: boolean;
  quietHoursStart: number; // 24-hour format
  quietHoursEnd: number; // 24-hour format
}

interface JobApplication {
  applicationId: string;
  companyName: string;
  position: string;
  applicationDate: Date;
}

interface NotificationHandlers {
  [key: string]: (response: Notifications.NotificationResponse) => void;
}

const STORAGE_KEYS = {
  PUSH_TOKEN: '@next_chapter/push_token',
  PREFERENCES: '@next_chapter/notification_preferences',
  LAST_BUDGET_ALERT: '@next_chapter/last_budget_alert',
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  dailyTasks: true,
  jobFollowUps: true,
  budgetAlerts: true,
  moodCheckIns: true,
  quietHoursStart: 22, // 10 PM
  quietHoursEnd: 8, // 8 AM
};

const BUDGET_ALERT_THRESHOLD = 60; // days
const BUDGET_ALERT_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in ms

export class NotificationService {
  private notificationHandlers: NotificationHandlers = {};
  private initialized = false;

  constructor() {
    // Don't initialize in tests
    if (typeof jest === 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.initialized) return;
    this.setupNotificationHandler();
    this.setupResponseListener();
    this.initialized = true;
  }

  private setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  private setupResponseListener(): void {
    Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationResponse(response);
    });
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications require a physical device');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token.data);
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify(preferences)
      );
      
      // Reschedule notifications based on new preferences
      await this.rescheduleAllNotifications();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  async scheduleDailyTaskReminder(): Promise<void> {
    const preferences = await this.getPreferences();
    
    if (!preferences.dailyTasks) {
      return;
    }

    // Cancel existing daily task reminders
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === NotificationType.DAILY_TASK) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }

    // Schedule new reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time for today's task! 💪",
        body: "Your 10-minute daily task is ready. You've got this!",
        data: { type: NotificationType.DAILY_TASK },
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.CALENDAR,
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }

  async scheduleJobFollowUp(application: JobApplication): Promise<void> {
    const preferences = await this.getPreferences();
    
    if (!preferences.jobFollowUps) {
      return;
    }

    const followUpDate = new Date(application.applicationDate);
    followUpDate.setDate(followUpDate.getDate() + 7); // Follow up after 7 days

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Follow up with ${application.companyName}`,
        body: `It's been a week since you applied for ${application.position}. Time to follow up!`,
        data: {
          type: NotificationType.JOB_FOLLOW_UP,
          applicationId: application.applicationId,
        },
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: followUpDate,
      },
    });
  }

  async checkBudgetRunway(daysRemaining: number): Promise<void> {
    const preferences = await this.getPreferences();
    
    if (!preferences.budgetAlerts || daysRemaining >= BUDGET_ALERT_THRESHOLD) {
      return;
    }

    // Check cooldown period
    const lastAlert = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BUDGET_ALERT);
    if (lastAlert) {
      const lastAlertTime = new Date(lastAlert).getTime();
      const now = Date.now();
      
      if (now - lastAlertTime < BUDGET_ALERT_COOLDOWN) {
        return;
      }
    }

    // Send alert
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Budget Alert',
        body: `Your financial runway is down to ${daysRemaining} days. Time to review your budget plan.`,
        data: { type: NotificationType.BUDGET_ALERT },
        sound: true,
      },
      trigger: null, // Immediate
    });

    // Update last alert time
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_BUDGET_ALERT, new Date().toISOString());
  }

  async scheduleMoodCheckIn(): Promise<void> {
    const preferences = await this.getPreferences();
    
    if (!preferences.moodCheckIns) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'How are you feeling today?',
        body: 'Take a moment to log your mood. Tracking helps identify patterns.',
        data: { type: NotificationType.MOOD_CHECK_IN },
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.CALENDAR,
        hour: 20, // 8 PM
        minute: 0,
        repeats: true,
      },
    });
  }

  async shouldSendNotification(
    type: NotificationType,
    isUrgent: boolean = false
  ): Promise<boolean> {
    if (isUrgent) {
      return true;
    }

    const preferences = await this.getPreferences();
    const now = new Date();
    const currentHour = now.getHours();

    // Check quiet hours
    if (preferences.quietHoursStart < preferences.quietHoursEnd) {
      // Quiet hours don't cross midnight
      if (currentHour >= preferences.quietHoursStart && currentHour < preferences.quietHoursEnd) {
        return false;
      }
    } else {
      // Quiet hours cross midnight
      if (currentHour >= preferences.quietHoursStart || currentHour < preferences.quietHoursEnd) {
        return false;
      }
    }

    // Check type-specific preferences
    switch (type) {
      case NotificationType.DAILY_TASK:
        return preferences.dailyTasks;
      case NotificationType.JOB_FOLLOW_UP:
        return preferences.jobFollowUps;
      case NotificationType.BUDGET_ALERT:
        return preferences.budgetAlerts;
      case NotificationType.MOOD_CHECK_IN:
        return preferences.moodCheckIns;
      default:
        return true;
    }
  }

  async scheduleLocalNotification(config: {
    title: string;
    body: string;
    trigger: Notifications.NotificationTriggerInput;
    data?: any;
  }): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.body,
        data: config.data,
        sound: true,
      },
      trigger: config.trigger,
    });
  }

  async scheduleNotificationWithDeepLink(config: {
    title: string;
    body: string;
    deepLink: string;
    trigger: Notifications.NotificationTriggerInput;
  }): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.body,
        data: {
          deepLink: config.deepLink,
        },
        sound: true,
      },
      trigger: config.trigger,
    });
  }

  setNotificationHandler(
    type: NotificationType,
    handler: (response: Notifications.NotificationResponse) => void
  ): void {
    this.notificationHandlers[type] = handler;
  }

  async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const type = response.notification.request.content.data?.type;
    
    if (type && typeof type === 'string' && this.notificationHandlers[type]) {
      this.notificationHandlers[type](response);
    }
  }

  getForegroundNotificationHandler() {
    return async (notification: Notifications.Notification) => {
      // Handle notification when app is in foreground
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    };
  }

  private async rescheduleAllNotifications(): Promise<void> {
    // Cancel all scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Reschedule based on current preferences
    const preferences = await this.getPreferences();
    
    if (preferences.dailyTasks) {
      await this.scheduleDailyTaskReminder();
    }
    
    if (preferences.moodCheckIns) {
      await this.scheduleMoodCheckIn();
    }
  }

  async getLastTaskCompletionDate(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@next_chapter/last_task_completion');
    } catch (error) {
      console.error('Error getting last task completion date:', error);
      return null;
    }
  }

  async setLastTaskCompletionDate(date: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@next_chapter/last_task_completion', date);
    } catch (error) {
      console.error('Error setting last task completion date:', error);
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();