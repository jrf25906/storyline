/**
 * Push notification service interface
 */

import { Result } from '@services/interfaces/common/result';

export interface IPushNotificationService {
  // Token management
  registerForPushNotifications(): Promise<Result<string>>;
  getPushToken(): Promise<Result<string | null>>;
  onTokenRefresh(callback: (token: string) => void): () => void;
  
  // Server integration
  sendTokenToServer(token: string, userId: string): Promise<Result<void>>;
  removeTokenFromServer(token: string): Promise<Result<void>>;
  
  // Topics/channels
  subscribeToTopic(topic: string): Promise<Result<void>>;
  unsubscribeFromTopic(topic: string): Promise<Result<void>>;
  getSubscribedTopics(): Promise<Result<string[]>>;
  
  // Remote notification handling
  onRemoteNotification(callback: RemoteNotificationHandler): () => void;
  onNotificationOpened(callback: RemoteNotificationOpenedHandler): () => void;
  
  // Background handling
  setBackgroundMessageHandler(handler: BackgroundMessageHandler): void;
  
  // Analytics
  trackNotificationOpened(notificationId: string): Promise<Result<void>>;
  trackNotificationDismissed(notificationId: string): Promise<Result<void>>;
  trackNotificationReceived(notificationId: string): Promise<Result<void>>;
}

export interface RemoteNotificationHandler {
  (notification: RemoteNotification): Promise<void>;
}

export interface RemoteNotificationOpenedHandler {
  (notification: RemoteNotification, actionId?: string): Promise<void>;
}

export interface BackgroundMessageHandler {
  (notification: RemoteNotification): Promise<void>;
}

export interface RemoteNotification {
  id: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  threadId?: string;
  categoryId?: string;
  contentAvailable?: boolean;
  mutableContent?: boolean;
  priority?: 'low' | 'normal' | 'high';
  collapseKey?: string;
  imageUrl?: string;
}