/**
 * Expo Notifications adapter implementing INotificationService
 * Handles push notifications with offline support
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { 
  INotificationService,
  NotificationPermissionStatus,
  NotificationRequest,
  ScheduledNotification,
  NotificationHandler,
  NotificationResponseHandler,
  NotificationCategory,
  NotificationPreferences,
  ReceivedNotification,
  NotificationHandlerResult,
  NotificationResponse
} from '@services/interfaces/notification/INotificationService';
import { IStorageService } from '@services/interfaces/data/IStorageService';
import { Result, ok, err, tryCatch } from '@services/interfaces/common/result';
import { ExternalServiceError } from '@services/interfaces/common/errors';

export class ExpoNotificationAdapter implements INotificationService {
  private readonly PREFERENCES_KEY = '@next_chapter/notification_preferences';
  private notificationSubscription: any = null;
  private responseSubscription: any = null;

  constructor(private storageService: IStorageService) {
    this.setupNotifications();
  }

  private setupNotifications(): void {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  async requestPermissions(): Promise<Result<boolean>> {
    return tryCatch(
      async () => {
        if (!Device.isDevice) {
          console.warn('Push notifications only work on physical devices');
          return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          return false;
        }

        // Get push token for remote notifications
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        return true;
      },
      (error) => new ExternalServiceError('Notifications', `Failed to request permissions: ${error}`)
    );
  }

  async checkPermissions(): Promise<Result<NotificationPermissionStatus>> {
    return tryCatch(
      async () => {
        const { status } = await Notifications.getPermissionsAsync();
        return status as NotificationPermissionStatus;
      },
      (error) => new ExternalServiceError('Notifications', `Failed to check permissions: ${error}`)
    );
  }

  async scheduleNotification(notification: NotificationRequest): Promise<Result<string>> {
    return tryCatch(
      async () => {
        const trigger = this.convertTrigger(notification.trigger);
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            sound: notification.sound === true ? 'default' : notification.sound || undefined,
            badge: notification.badge,
            categoryIdentifier: notification.categoryId,
            attachments: notification.attachments,
          },
          trigger,
        });

        return notificationId;
      },
      (error) => new ExternalServiceError('Notifications', `Failed to schedule notification: ${error}`)
    );
  }

  async cancelNotification(notificationId: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      },
      (error) => new ExternalServiceError('Notifications', `Failed to cancel notification: ${error}`)
    );
  }

  async cancelAllNotifications(): Promise<Result<void>> {
    return tryCatch(
      async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
      },
      (error) => new ExternalServiceError('Notifications', `Failed to cancel all notifications: ${error}`)
    );
  }

  async getScheduledNotifications(): Promise<Result<ScheduledNotification[]>> {
    return tryCatch(
      async () => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        
        return scheduled.map(notification => ({
          id: notification.identifier,
          request: {
            title: notification.content.title || '',
            body: notification.content.body || '',
            data: notification.content.data,
            sound: notification.content.sound as any,
            badge: notification.content.badge ?? undefined,
            categoryId: notification.content.categoryIdentifier,
            trigger: this.reverseConvertTrigger(notification.trigger),
            attachments: notification.content.attachments,
          },
          scheduledAt: this.getScheduledDate(notification.trigger),
        }));
      },
      (error) => new ExternalServiceError('Notifications', `Failed to get scheduled notifications: ${error}`)
    );
  }

  async updateScheduledNotification(
    notificationId: string,
    updates: Partial<NotificationRequest>
  ): Promise<Result<void>> {
    return tryCatch(
      async () => {
        // Get existing notification
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const existing = scheduled.find(n => n.identifier === notificationId);
        
        if (!existing) {
          throw new Error(`Notification ${notificationId} not found`);
        }

        // Cancel existing
        await Notifications.cancelScheduledNotificationAsync(notificationId);

        // Reschedule with updates
        const merged: NotificationRequest = {
          title: updates.title ?? existing.content.title ?? '',
          body: updates.body ?? existing.content.body ?? '',
          data: updates.data ?? existing.content.data,
          sound: updates.sound ?? existing.content.sound as any,
          badge: updates.badge ?? existing.content.badge ?? undefined,
          categoryId: updates.categoryId ?? existing.content.categoryIdentifier,
          trigger: updates.trigger ?? this.reverseConvertTrigger(existing.trigger),
          attachments: updates.attachments ?? existing.content.attachments,
        };

        await this.scheduleNotification(merged);
      },
      (error) => new ExternalServiceError('Notifications', `Failed to update notification: ${error}`)
    );
  }

  setNotificationHandler(handler: NotificationHandler): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.remove();
    }

    const expoHandler: Notifications.NotificationHandler = {
      handleNotification: async (notification) => {
        const received: ReceivedNotification = {
          id: notification.request.identifier,
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
          data: notification.request.content.data,
          categoryId: notification.request.content.categoryIdentifier,
        };

        const result = await handler(received);
        
        return {
          shouldShowAlert: result.shouldShowAlert,
          shouldPlaySound: result.shouldPlaySound,
          shouldSetBadge: result.shouldSetBadge,
        };
      },
    };

    Notifications.setNotificationHandler(expoHandler);
  }

  setResponseHandler(handler: NotificationResponseHandler): void {
    if (this.responseSubscription) {
      this.responseSubscription.remove();
    }

    this.responseSubscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const notificationResponse: NotificationResponse = {
          notification: {
            id: response.notification.request.identifier,
            title: response.notification.request.content.title || '',
            body: response.notification.request.content.body || '',
            data: response.notification.request.content.data,
            categoryId: response.notification.request.content.categoryIdentifier,
          },
          actionId: response.actionIdentifier,
          userText: response.userText,
        };

        await handler(notificationResponse);
      }
    );
  }

  async setBadgeCount(count: number): Promise<Result<void>> {
    return tryCatch(
      async () => {
        if (Platform.OS === 'ios') {
          await Notifications.setBadgeCountAsync(count);
        }
      },
      (error) => new ExternalServiceError('Notifications', `Failed to set badge count: ${error}`)
    );
  }

  async getBadgeCount(): Promise<Result<number>> {
    return tryCatch(
      async () => {
        if (Platform.OS === 'ios') {
          return await Notifications.getBadgeCountAsync();
        }
        return 0;
      },
      (error) => new ExternalServiceError('Notifications', `Failed to get badge count: ${error}`)
    );
  }

  async clearBadge(): Promise<Result<void>> {
    return this.setBadgeCount(0);
  }

  async setNotificationCategories(categories: NotificationCategory[]): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const expoCategories = categories.map(category => ({
          identifier: category.id,
          actions: category.actions.map(action => ({
            identifier: action.id,
            buttonTitle: action.title,
            options: {
              opensAppToForeground: action.options?.foreground,
              isDestructive: action.options?.destructive,
              isAuthenticationRequired: action.options?.authenticationRequired,
            },
          })),
          options: category.options,
        }));

        await Notifications.setNotificationCategoriesAsync(expoCategories);
      },
      (error) => new ExternalServiceError('Notifications', `Failed to set categories: ${error}`)
    );
  }

  async getPreferences(): Promise<Result<NotificationPreferences>> {
    const result = await this.storageService.get<NotificationPreferences>(this.PREFERENCES_KEY);
    
    if (result.isErr()) return result;
    
    // Return default preferences if none saved
    if (!result.value) {
      return ok(this.getDefaultPreferences());
    }
    
    return ok(result.value);
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<Result<void>> {
    const currentResult = await this.getPreferences();
    if (currentResult.isErr()) return currentResult;
    
    const updated = { ...currentResult.value, ...preferences };
    return this.storageService.set(this.PREFERENCES_KEY, updated);
  }

  // Helper methods
  private convertTrigger(trigger?: NotificationRequest['trigger']): Notifications.NotificationTriggerInput | null {
    if (!trigger) return null;

    switch (trigger.type) {
      case 'immediate':
        return null;
      
      case 'date':
        return { date: trigger.date };
      
      case 'interval':
        return {
          seconds: trigger.seconds,
          repeats: trigger.repeats,
        };
      
      case 'calendar':
        return {
          ...trigger.dateComponents,
          repeats: trigger.repeats,
        };
      
      case 'location':
        // Location triggers not supported in Expo
        console.warn('Location triggers are not supported');
        return null;
      
      default:
        return null;
    }
  }

  private reverseConvertTrigger(trigger: any): NotificationRequest['trigger'] {
    if (!trigger) {
      return { type: 'immediate' };
    }

    if ('date' in trigger) {
      return { type: 'date', date: new Date(trigger.date) };
    }

    if ('seconds' in trigger) {
      return {
        type: 'interval',
        seconds: trigger.seconds,
        repeats: trigger.repeats,
      };
    }

    // Calendar trigger
    return {
      type: 'calendar',
      dateComponents: trigger,
      repeats: trigger.repeats,
    };
  }

  private getScheduledDate(trigger: any): Date {
    if (!trigger) {
      return new Date();
    }

    if ('date' in trigger) {
      return new Date(trigger.date);
    }

    if ('seconds' in trigger) {
      const date = new Date();
      date.setSeconds(date.getSeconds() + trigger.seconds);
      return date;
    }

    // For calendar triggers, estimate next occurrence
    const now = new Date();
    const scheduled = new Date();

    if (trigger.year) scheduled.setFullYear(trigger.year);
    if (trigger.month) scheduled.setMonth(trigger.month - 1);
    if (trigger.day) scheduled.setDate(trigger.day);
    if (trigger.hour) scheduled.setHours(trigger.hour);
    if (trigger.minute) scheduled.setMinutes(trigger.minute);
    if (trigger.second) scheduled.setSeconds(trigger.second);

    // If scheduled time is in past and repeats, find next occurrence
    if (scheduled < now && trigger.repeats) {
      // Simple approximation - would need more complex logic for accurate calculation
      while (scheduled < now) {
        scheduled.setDate(scheduled.getDate() + 7); // Assume weekly repeat
      }
    }

    return scheduled;
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      sound: true,
      badge: true,
      alert: true,
      carPlay: false,
      criticalAlert: false,
      announcement: false,
      quietHours: {
        enabled: false,
        startHour: 22,
        endHour: 8,
      },
      categories: {
        daily_task: true,
        coach_reminder: true,
        budget_alert: true,
        application_update: true,
      },
    };
  }

  async getPushToken(): Promise<Result<string>> {
    return tryCatch(
      async () => {
        if (!Device.isDevice) {
          throw new Error('Push notifications only work on physical devices');
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        
        if (!projectId) {
          throw new Error('Project ID not found in app config');
        }

        const token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        return token.data;
      },
      (error) => new ExternalServiceError('Notifications', `Failed to get push token: ${error}`)
    );
  }

  destroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.remove();
      this.notificationSubscription = null;
    }

    if (this.responseSubscription) {
      this.responseSubscription.remove();
      this.responseSubscription = null;
    }
  }
}