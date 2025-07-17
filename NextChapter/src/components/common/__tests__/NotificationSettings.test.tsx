import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationSettings } from '../NotificationSettings';
import { notificationService } from '../../../services/notifications/notificationService';

// Mock the notification service
jest.mock('../../../services/notifications/notificationService');

describe('NotificationSettings', () => {
  const mockPreferences = {
    dailyTasks: true,
    jobFollowUps: true,
    budgetAlerts: true,
    moodCheckIns: false,
    quietHoursStart: 22,
    quietHoursEnd: 8,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (notificationService.getPreferences as jest.Mock).mockResolvedValue(mockPreferences);
    (notificationService.updatePreferences as jest.Mock).mockResolvedValue(undefined);
  });

  it('should display current notification preferences', async () => {
    const { getByTestId } = render(<NotificationSettings />);
    
    await waitFor(() => {
      expect(getByTestId('switch-daily-tasks').props.value).toBe(true);
      expect(getByTestId('switch-job-follow-ups').props.value).toBe(true);
      expect(getByTestId('switch-budget-alerts').props.value).toBe(true);
      expect(getByTestId('switch-mood-check-ins').props.value).toBe(false);
    });
  });

  it('should update preference when switch is toggled', async () => {
    const { getByTestId } = render(<NotificationSettings />);
    
    await waitFor(() => {
      const dailyTaskSwitch = getByTestId('switch-daily-tasks');
      fireEvent(dailyTaskSwitch, 'valueChange', false);
    });

    expect(notificationService.updatePreferences).toHaveBeenCalledWith({
      ...mockPreferences,
      dailyTasks: false,
    });
  });

  it('should display quiet hours settings', async () => {
    const { getByText } = render(<NotificationSettings />);
    
    await waitFor(() => {
      expect(getByText('Quiet Hours')).toBeTruthy();
      expect(getByText('10:00 PM - 8:00 AM')).toBeTruthy();
    });
  });

  it('should show permission request button when not granted', async () => {
    (notificationService.requestPermissions as jest.Mock).mockResolvedValue(false);
    
    const { getByText } = render(<NotificationSettings />);
    
    await waitFor(() => {
      expect(getByText('Enable Notifications')).toBeTruthy();
    });
  });

  it('should request permissions when button pressed', async () => {
    (notificationService.requestPermissions as jest.Mock).mockResolvedValue(true);
    
    const { getByText } = render(<NotificationSettings />);
    
    const button = getByText('Enable Notifications');
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(notificationService.requestPermissions).toHaveBeenCalled();
    });
  });

  it('should display helpful description for each notification type', async () => {
    const { getByText } = render(<NotificationSettings />);
    
    await waitFor(() => {
      expect(getByText('Get reminded of your daily 10-minute task')).toBeTruthy();
      expect(getByText('Reminders to follow up on job applications')).toBeTruthy();
      expect(getByText('Alerts when your budget runway is low')).toBeTruthy();
      expect(getByText('Evening reminders to track your mood')).toBeTruthy();
    });
  });

  it('should show quiet hours picker when tapped', async () => {
    const { getByText, getByTestId } = render(<NotificationSettings />);
    
    const quietHoursButton = getByText('10:00 PM - 8:00 AM');
    fireEvent.press(quietHoursButton);
    
    await waitFor(() => {
      expect(getByTestId('quiet-hours-picker')).toBeTruthy();
    });
  });

  it('should update quiet hours when changed', async () => {
    const { getByText, getByTestId } = render(<NotificationSettings />);
    
    const quietHoursButton = getByText('10:00 PM - 8:00 AM');
    fireEvent.press(quietHoursButton);
    
    await waitFor(() => {
      const startPicker = getByTestId('quiet-hours-start-picker');
      fireEvent(startPicker, 'change', { nativeEvent: { timestamp: new Date('2024-01-01T21:00:00') } });
    });

    expect(notificationService.updatePreferences).toHaveBeenCalledWith({
      ...mockPreferences,
      quietHoursStart: 21,
    });
  });

  it('should show test notification button', async () => {
    const { getByText } = render(<NotificationSettings />);
    
    await waitFor(() => {
      expect(getByText('Send Test Notification')).toBeTruthy();
    });
  });

  it('should send test notification when button pressed', async () => {
    (notificationService.scheduleLocalNotification as jest.Mock).mockResolvedValue(undefined);
    
    const { getByText } = render(<NotificationSettings />);
    
    const testButton = getByText('Send Test Notification');
    fireEvent.press(testButton);
    
    await waitFor(() => {
      expect(notificationService.scheduleLocalNotification).toHaveBeenCalledWith({
        title: 'Test Notification',
        body: 'Notifications are working! You\'ll receive helpful reminders at the right times.',
        trigger: null,
      });
    });
  });

  it('should handle errors gracefully', async () => {
    (notificationService.updatePreferences as jest.Mock).mockRejectedValue(
      new Error('Failed to save')
    );
    
    const { getByTestId, getByText } = render(<NotificationSettings />);
    
    await waitFor(() => {
      const dailyTaskSwitch = getByTestId('switch-daily-tasks');
      fireEvent(dailyTaskSwitch, 'valueChange', false);
    });
    
    await waitFor(() => {
      expect(getByText('Failed to update notification settings')).toBeTruthy();
    });
  });

  it('should be accessible', async () => {
    const { getByTestId } = render(<NotificationSettings />);
    
    await waitFor(() => {
      const dailyTaskSwitch = getByTestId('switch-daily-tasks');
      expect(dailyTaskSwitch.props.accessibilityRole).toBe('switch');
      expect(dailyTaskSwitch.props.accessibilityLabel).toBe('Daily Task Reminders');
      expect(dailyTaskSwitch.props.accessibilityHint).toBe('Toggle daily task reminder notifications');
    });
  });
});