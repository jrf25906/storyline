import React from 'react';
import { AppState, AppStateStatus, Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { NotificationSetup } from '@components/app/NotificationSetup';
import { notificationService } from '@services/notifications/notificationService';
import { setupNotificationHandlers } from '@services/notifications/notificationHandlers';
import { useNotifications } from '@hooks/useNotifications';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useBudgetStore } from '@stores/budgetStore';
import { useAuth } from '@hooks/useAuth';
import { useOnboardingStore } from '@stores/onboardingStore';

// Mock dependencies
jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
}));
jest.mock('../../../services/notifications/notificationService', () => ({
  notificationService: {
    registerForPushNotifications: jest.fn(),
    getLastTaskCompletionDate: jest.fn(),
    scheduleLocalNotification: jest.fn(),
  }
}));
jest.mock('../../../services/notifications/notificationHandlers');
jest.mock('../../../hooks/useNotifications');
jest.mock('../../../stores/bouncePlanStore');
jest.mock('../../../stores/budgetStore');
jest.mock('../../../hooks/useAuth');
jest.mock('../../../stores/onboardingStore');

// Mock AppState
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Fix for React Native 0.72+ AppState API changes
Object.defineProperty(AppState, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
  configurable: true
});

// Mock AppState.currentState
Object.defineProperty(AppState, 'currentState', {
  value: 'active',
  writable: true,
  configurable: true
});

describe('NotificationSetup', () => {
  const mockNavigationRef = { current: { navigate: jest.fn() } };
  const mockResponseListener = { remove: jest.fn() };
  const mockScheduleDailyReminder = jest.fn();
  const mockScheduleMoodCheckIn = jest.fn();
  const mockCheckBudgetRunway = jest.fn();
  const mockRequestPermissions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
      mockResponseListener
    );

    (setupNotificationHandlers as jest.Mock).mockReturnValue({
      handleNotificationResponse: jest.fn(),
    });

    (useNotifications as jest.Mock).mockReturnValue({
      scheduleDailyReminder: mockScheduleDailyReminder,
      scheduleMoodCheckIn: mockScheduleMoodCheckIn,
      checkBudgetRunway: mockCheckBudgetRunway,
      requestPermissions: mockRequestPermissions,
    });

    (useAuth as jest.Mock).mockReturnValue({ user: null });
    (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: false });
    (useBouncePlanStore as jest.Mock).mockReturnValue({ currentDay: 0 });
    (useBudgetStore as jest.Mock).mockReturnValue({ runway: null });

    mockAddEventListener.mockReturnValue({ remove: mockRemoveEventListener });
  });

  describe('Initialization', () => {
    it('should render children', () => {
      const { getByText } = render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test Child</Text>
        </NotificationSetup>
      );

      expect(getByText('Test Child')).toBeTruthy();
    });

    it('should setup notification handlers on mount', () => {
      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      expect(setupNotificationHandlers).toHaveBeenCalledWith(mockNavigationRef);
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });

    it('should setup app state listener', () => {
      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should cleanup on unmount', () => {
      const { unmount } = render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      unmount();

      expect(mockResponseListener.remove).toHaveBeenCalled();
      expect(mockRemoveEventListener).toHaveBeenCalled();
    });
  });

  describe('Permission Handling', () => {
    it('should request permissions when onboarded', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });
    });

    it('should not request permissions when not onboarded', () => {
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: false });

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      expect(mockRequestPermissions).not.toHaveBeenCalled();
    });

    it('should register for push notifications when permissions granted', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });
      (notificationService.registerForPushNotifications as jest.Mock).mockResolvedValue(true);

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(notificationService.registerForPushNotifications).toHaveBeenCalled();
      });
    });

    it('should schedule initial notifications when permissions granted', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockScheduleDailyReminder).toHaveBeenCalled();
        expect(mockScheduleMoodCheckIn).toHaveBeenCalled();
      });
    });

    it('should not schedule notifications when permissions denied', async () => {
      mockRequestPermissions.mockResolvedValue(false);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });

      expect(mockScheduleDailyReminder).not.toHaveBeenCalled();
      expect(mockScheduleMoodCheckIn).not.toHaveBeenCalled();
    });
  });

  describe('Budget Runway Monitoring', () => {
    it('should check budget runway when it changes', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });

      const { rerender } = render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });

      // Update budget runway
      (useBudgetStore as jest.Mock).mockReturnValue({ 
        runway: { runwayInDays: 45 } 
      });

      rerender(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      expect(mockCheckBudgetRunway).toHaveBeenCalledWith(45);
    });

    it('should not check budget runway without permissions', () => {
      (useBudgetStore as jest.Mock).mockReturnValue({ 
        runway: { runwayInDays: 45 } 
      });

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      expect(mockCheckBudgetRunway).not.toHaveBeenCalled();
    });
  });

  describe('App State Changes', () => {
    it.skip('should refresh notifications when app comes to foreground', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });
      (useBouncePlanStore as jest.Mock).mockReturnValue({ currentDay: 5 });
      (notificationService.getLastTaskCompletionDate as jest.Mock).mockResolvedValue('2023-01-01');

      const mockDate = new Date('2023-01-02T14:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });

      // Set current state to background first
      AppState.currentState = 'background';
      
      // Simulate app state change
      const appStateHandler = mockAddEventListener.mock.calls[0][1];
      appStateHandler('active');

      await waitFor(() => {
        expect(notificationService.getLastTaskCompletionDate).toHaveBeenCalled();
        expect(notificationService.scheduleLocalNotification).toHaveBeenCalledWith({
          title: 'Your daily task is waiting',
          body: 'Take 10 minutes to move forward today',
          trigger: { type: 'timeInterval', seconds: 1 },
        });
      }, { timeout: 2000 });
    });

    it.skip('should not show reminder before noon', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });
      (useBouncePlanStore as jest.Mock).mockReturnValue({ currentDay: 5 });
      (notificationService.getLastTaskCompletionDate as jest.Mock).mockResolvedValue('2023-01-01');

      const mockDate = new Date('2023-01-02T10:00:00'); // 10 AM
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });

      // Set current state to background first
      AppState.currentState = 'background';
      
      // Simulate app state change
      const appStateHandler = mockAddEventListener.mock.calls[0][1];
      appStateHandler('active');

      await waitFor(() => {
        expect(notificationService.getLastTaskCompletionDate).toHaveBeenCalled();
      });

      expect(notificationService.scheduleLocalNotification).not.toHaveBeenCalled();
    });

    it('should not refresh notifications when app goes to background', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });

      // Set current state to active first
      AppState.currentState = 'active';
      
      // Simulate app going to background
      const appStateHandler = mockAddEventListener.mock.calls[0][1];
      appStateHandler('background');

      expect(notificationService.getLastTaskCompletionDate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in scheduling initial notifications', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      mockScheduleDailyReminder.mockRejectedValue(new Error('Schedule error'));
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error scheduling initial notifications:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('User Experience', () => {
    it.skip('should not interrupt user if already completed task today', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });
      (useBouncePlanStore as jest.Mock).mockReturnValue({ currentDay: 5 });

      const today = new Date().toDateString();
      (notificationService.getLastTaskCompletionDate as jest.Mock).mockResolvedValue(today);

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });

      // Set current state to background first
      AppState.currentState = 'background';
      
      // Simulate app state change
      const appStateHandler = mockAddEventListener.mock.calls[0][1];
      appStateHandler('active');

      await waitFor(() => {
        expect(notificationService.getLastTaskCompletionDate).toHaveBeenCalled();
      });

      expect(notificationService.scheduleLocalNotification).not.toHaveBeenCalled();
    });

    it.skip('should use gentle, supportive notification copy', async () => {
      mockRequestPermissions.mockResolvedValue(true);
      (useOnboardingStore as jest.Mock).mockReturnValue({ isCompleted: true });
      (useBouncePlanStore as jest.Mock).mockReturnValue({ currentDay: 5 });
      (notificationService.getLastTaskCompletionDate as jest.Mock).mockResolvedValue('2023-01-01');

      const mockDate = new Date('2023-01-02T14:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      render(
        <NotificationSetup navigationRef={mockNavigationRef as any}>
          <Text>Test</Text>
        </NotificationSetup>
      );

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
      });

      const appStateHandler = mockAddEventListener.mock.calls[0][1];
      appStateHandler('active');

      await waitFor(() => {
        expect(notificationService.scheduleLocalNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Your daily task is waiting',
            body: 'Take 10 minutes to move forward today',
          })
        );
      });
    });
  });
});