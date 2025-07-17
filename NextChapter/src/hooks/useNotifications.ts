import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { 
  notificationService, 
  NotificationPreferences,
  NotificationType 
} from '../services/notifications/notificationService';

interface JobApplication {
  applicationId: string;
  companyName: string;
  position: string;
  applicationDate: Date;
}

export const useNotifications = () => {
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Handle notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setLastNotification(notification);
    });

    // Handle interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      notificationService.handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    return await notificationService.requestPermissions();
  };

  const scheduleDailyReminder = async (): Promise<void> => {
    await notificationService.scheduleDailyTaskReminder();
  };

  const scheduleJobFollowUp = async (application: JobApplication): Promise<void> => {
    await notificationService.scheduleJobFollowUp(application);
  };

  const checkBudgetRunway = async (daysRemaining: number): Promise<void> => {
    await notificationService.checkBudgetRunway(daysRemaining);
  };

  const scheduleMoodCheckIn = async (): Promise<void> => {
    await notificationService.scheduleMoodCheckIn();
  };

  const updatePreferences = async (preferences: NotificationPreferences): Promise<void> => {
    await notificationService.updatePreferences(preferences);
  };

  const cancelAllNotifications = async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
    return await Notifications.getAllScheduledNotificationsAsync();
  };

  return {
    lastNotification,
    requestPermissions,
    scheduleDailyReminder,
    scheduleJobFollowUp,
    checkBudgetRunway,
    scheduleMoodCheckIn,
    updatePreferences,
    cancelAllNotifications,
    getScheduledNotifications,
  };
};