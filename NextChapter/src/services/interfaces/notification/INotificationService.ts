/**
 * Notification service interfaces
 */

import { Result } from '@services/interfaces/common/result';

export interface INotificationService {
  // Permission management
  requestPermissions(): Promise<Result<boolean>>;
  checkPermissions(): Promise<Result<NotificationPermissionStatus>>;
  
  // Local notifications
  scheduleNotification(notification: NotificationRequest): Promise<Result<string>>;
  cancelNotification(notificationId: string): Promise<Result<void>>;
  cancelAllNotifications(): Promise<Result<void>>;
  
  // Scheduled notifications
  getScheduledNotifications(): Promise<Result<ScheduledNotification[]>>;
  updateScheduledNotification(
    notificationId: string,
    updates: Partial<NotificationRequest>
  ): Promise<Result<void>>;
  
  // Notification handling
  setNotificationHandler(handler: NotificationHandler): void;
  setResponseHandler(handler: NotificationResponseHandler): void;
  
  // Badge management
  setBadgeCount(count: number): Promise<Result<void>>;
  getBadgeCount(): Promise<Result<number>>;
  clearBadge(): Promise<Result<void>>;
  
  // Categories and actions
  setNotificationCategories(categories: NotificationCategory[]): Promise<Result<void>>;
  
  // Preferences
  getPreferences(): Promise<Result<NotificationPreferences>>;
  updatePreferences(preferences: Partial<NotificationPreferences>): Promise<Result<void>>;
}

export type NotificationPermissionStatus = 
  | 'granted'
  | 'denied'
  | 'undetermined';

export interface NotificationRequest {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean | string;
  badge?: number;
  categoryId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  trigger?: NotificationTrigger;
  attachments?: NotificationAttachment[];
}

export type NotificationTrigger = 
  | { type: 'immediate' }
  | { type: 'date'; date: Date }
  | { type: 'interval'; seconds: number; repeats?: boolean }
  | { type: 'calendar'; dateComponents: CalendarTrigger; repeats?: boolean }
  | { type: 'location'; region: LocationTrigger };

export interface CalendarTrigger {
  hour?: number;
  minute?: number;
  second?: number;
  weekday?: number;
  day?: number;
  month?: number;
  year?: number;
}

export interface LocationTrigger {
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
}

export interface NotificationAttachment {
  uri: string;
  type?: string;
  thumbnailUri?: string;
}

export interface ScheduledNotification {
  id: string;
  request: NotificationRequest;
  scheduledAt: Date;
}

export interface NotificationCategory {
  id: string;
  actions: NotificationAction[];
  options?: NotificationCategoryOptions;
}

export interface NotificationAction {
  id: string;
  title: string;
  options?: {
    foreground?: boolean;
    destructive?: boolean;
    authenticationRequired?: boolean;
  };
}

export interface NotificationCategoryOptions {
  customDismissAction?: boolean;
  allowInCarPlay?: boolean;
  hiddenPreviewsShowTitle?: boolean;
  hiddenPreviewsShowSubtitle?: boolean;
}

export interface NotificationHandler {
  (notification: ReceivedNotification): Promise<NotificationHandlerResult>;
}

export interface NotificationResponseHandler {
  (response: NotificationResponse): Promise<void>;
}

export interface ReceivedNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
}

export interface NotificationHandlerResult {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
}

export interface NotificationResponse {
  notification: ReceivedNotification;
  actionId?: string;
  userText?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  badge: boolean;
  alert: boolean;
  carPlay: boolean;
  criticalAlert: boolean;
  announcement: boolean;
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  categories: {
    [key: string]: boolean;
  };
}