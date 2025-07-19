import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';
import { NotificationType } from '@services/notifications/notificationService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const setupNotificationHandlers = (
  navigationRef: React.RefObject<NavigationContainerRef<any>>
) => {
  // Handle notification taps
  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;

    if (!navigationRef.current) {
      return;
    }

    // Handle deep links
    if (data?.deepLink && typeof data.deepLink === 'string') {
      handleDeepLink(data.deepLink, navigationRef.current);
      return;
    }

    // Handle specific notification types
    switch (data?.type) {
      case NotificationType.DAILY_TASK:
        navigationRef.current.navigate('BouncePlan', {
          screen: 'DailyTask',
        });
        break;

      case NotificationType.JOB_FOLLOW_UP:
        if (data.applicationId) {
          navigationRef.current.navigate('Tracker', {
            screen: 'ApplicationDetails',
            params: { applicationId: data.applicationId },
          });
        } else {
          navigationRef.current.navigate('Tracker');
        }
        break;

      case NotificationType.BUDGET_ALERT:
        navigationRef.current.navigate('Budget', {
          screen: 'BudgetOverview',
        });
        break;

      case NotificationType.MOOD_CHECK_IN:
        navigationRef.current.navigate('Profile', {
          screen: 'Wellness',
        });
        break;

      default:
        // Navigate to home if no specific handler
        navigationRef.current.navigate('Home');
    }
  };

  // Handle deep links
  const handleDeepLink = (
    deepLink: string,
    navigation: NavigationContainerRef<any>
  ) => {
    // Parse deep link format: nextchapter://screen/params
    const match = deepLink.match(/^nextchapter:\/\/([^\/]+)(?:\/(.+))?$/);
    
    if (!match) {
      return;
    }

    const [, screen, params] = match;

    switch (screen) {
      case 'bounce-plan':
        if (params === 'progress') {
          navigation.navigate('BouncePlan', {
            screen: 'TaskHistory',
          });
        } else {
          navigation.navigate('BouncePlan');
        }
        break;

      case 'job-tracker':
        navigation.navigate('Tracker');
        break;

      case 'budget':
        navigation.navigate('Budget');
        break;

      case 'mood':
        navigation.navigate('Profile', {
          screen: 'Wellness',
        });
        break;

      case 'coach':
        navigation.navigate('Coach');
        break;

      default:
        navigation.navigate('Home');
    }
  };

  return {
    handleNotificationResponse,
  };
};