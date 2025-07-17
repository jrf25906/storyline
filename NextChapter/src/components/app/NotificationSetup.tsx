import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import { notificationService } from '../../services/notifications/notificationService';
import { setupNotificationHandlers } from '../../services/notifications/notificationHandlers';
import { useNotifications } from '../../hooks/useNotifications';
import { useBouncePlanStore } from '../../stores/bouncePlanStore';
import { useBudgetStore } from '../../stores/budgetStore';
import { useAuth } from '../../hooks/useAuth';
import { useOnboardingStore } from '../../stores/onboardingStore';

interface NotificationSetupProps {
  navigationRef: React.RefObject<NavigationContainerRef<any>>;
  children: React.ReactNode;
}

export const NotificationSetup: React.FC<NotificationSetupProps> = ({
  navigationRef,
  children,
}) => {
  const appState = useRef(AppState.currentState);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const notifications = useNotifications();
  const { scheduleDailyReminder, scheduleMoodCheckIn, checkBudgetRunway, requestPermissions } = notifications;
  const { user } = useAuth();
  const { isCompleted: isOnboarded } = useOnboardingStore();
  const { currentDay } = useBouncePlanStore();
  const { runway } = useBudgetStore();
  const [hasNotificationPermission, setHasNotificationPermission] = React.useState(false);

  useEffect(() => {
    // Setup notification handlers
    const handlers = setupNotificationHandlers(navigationRef);

    // Listen for notification responses
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handlers.handleNotificationResponse
    );

    // Check and request permissions if onboarded
    if (isOnboarded && !hasNotificationPermission) {
      checkAndRequestPermissions();
    }

    // Schedule initial notifications if permissions granted
    if (hasNotificationPermission) {
      scheduleInitialNotifications();
    }

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
      subscription.remove();
    };
  }, [isOnboarded, hasNotificationPermission]);

  // Check budget runway when it changes
  useEffect(() => {
    if (hasNotificationPermission && runway?.runwayInDays !== undefined) {
      checkBudgetRunway(runway.runwayInDays);
    }
  }, [runway?.runwayInDays, hasNotificationPermission, checkBudgetRunway]);

  const checkAndRequestPermissions = async () => {
    const granted = await requestPermissions();
    setHasNotificationPermission(granted);
    
    if (granted) {
      // Register for push notifications
      await notificationService.registerForPushNotifications();
      
      // Schedule initial notifications
      await scheduleInitialNotifications();
    }
  };

  const scheduleInitialNotifications = async () => {
    try {
      // Schedule daily task reminder
      await scheduleDailyReminder();
      
      // Schedule mood check-in
      await scheduleMoodCheckIn();
    } catch (error) {
      console.error('Error scheduling initial notifications:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground
      // Check if we need to refresh any notifications
      if (hasNotificationPermission) {
        refreshNotifications();
      }
    }

    appState.current = nextAppState;
  };

  const refreshNotifications = async () => {
    // Check if daily task was completed today
    const today = new Date().toDateString();
    const lastTaskDate = await notificationService.getLastTaskCompletionDate();
    
    if (lastTaskDate !== today && currentDay > 0) {
      // User hasn't completed today's task yet
      // Could show a gentle reminder if it's past a certain time
      const now = new Date();
      if (now.getHours() >= 12) { // After noon
        await notificationService.scheduleLocalNotification({
          title: 'Your daily task is waiting',
          body: 'Take 10 minutes to move forward today',
          trigger: { type: 'timeInterval', seconds: 1 } as Notifications.TimeIntervalTriggerInput,
        });
      }
    }
  };

  return <>{children}</>;
};