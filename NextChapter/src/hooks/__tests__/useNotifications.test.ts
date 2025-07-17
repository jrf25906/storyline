import { renderHook, act } from '@testing-library/react-hooks';
import { useNotifications } from '../useNotifications';
import { notificationService } from '../../services/notifications/notificationService';
import * as Notifications from 'expo-notifications';

jest.mock('../../services/notifications/notificationService');
jest.mock('expo-notifications');

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize notification handlers on mount', () => {
    renderHook(() => useNotifications());

    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
  });

  it('should schedule daily task reminder', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.scheduleDailyReminder();
    });

    expect(notificationService.scheduleDailyTaskReminder).toHaveBeenCalled();
  });

  it('should schedule job follow-up', async () => {
    const { result } = renderHook(() => useNotifications());

    const application = {
      applicationId: 'job-123',
      companyName: 'TechCorp',
      position: 'Developer',
      applicationDate: new Date(),
    };

    await act(async () => {
      await result.current.scheduleJobFollowUp(application);
    });

    expect(notificationService.scheduleJobFollowUp).toHaveBeenCalledWith(application);
  });

  it('should check budget runway', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.checkBudgetRunway(45);
    });

    expect(notificationService.checkBudgetRunway).toHaveBeenCalledWith(45);
  });

  it('should schedule mood check-in', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.scheduleMoodCheckIn();
    });

    expect(notificationService.scheduleMoodCheckIn).toHaveBeenCalled();
  });

  it('should handle notification received in foreground', async () => {
    const mockListener = jest.fn();
    (Notifications.addNotificationReceivedListener as jest.Mock).mockImplementation(
      (callback) => {
        mockListener.mockImplementation(callback);
        return { remove: jest.fn() };
      }
    );

    const { result } = renderHook(() => useNotifications());

    const mockNotification = {
      request: {
        content: {
          title: 'Test',
          body: 'Test notification',
        },
      },
    };

    act(() => {
      mockListener(mockNotification);
    });

    expect(result.current.lastNotification).toEqual(mockNotification);
  });

  it('should handle notification response', async () => {
    const mockListener = jest.fn();
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation(
      (callback) => {
        mockListener.mockImplementation(callback);
        return { remove: jest.fn() };
      }
    );

    renderHook(() => useNotifications());

    const mockResponse = {
      notification: {
        request: {
          content: {
            data: { type: 'DAILY_TASK' },
          },
        },
      },
    };

    act(() => {
      mockListener(mockResponse);
    });

    expect(notificationService.handleNotificationResponse).toHaveBeenCalledWith(mockResponse);
  });

  it('should request permissions', async () => {
    (notificationService.requestPermissions as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useNotifications());

    let granted;
    await act(async () => {
      granted = await result.current.requestPermissions();
    });

    expect(granted).toBe(true);
    expect(notificationService.requestPermissions).toHaveBeenCalled();
  });

  it('should update preferences', async () => {
    const { result } = renderHook(() => useNotifications());

    const newPreferences = {
      dailyTasks: false,
      jobFollowUps: true,
      budgetAlerts: true,
      moodCheckIns: false,
      quietHoursStart: 21,
      quietHoursEnd: 9,
    };

    await act(async () => {
      await result.current.updatePreferences(newPreferences);
    });

    expect(notificationService.updatePreferences).toHaveBeenCalledWith(newPreferences);
  });

  it('should clean up listeners on unmount', () => {
    const mockRemove = jest.fn();
    (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
      remove: mockRemove,
    });
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
      remove: mockRemove,
    });

    const { unmount } = renderHook(() => useNotifications());

    unmount();

    expect(mockRemove).toHaveBeenCalledTimes(2);
  });

  it('should cancel all notifications', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await result.current.cancelAllNotifications();
    });

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });

  it('should get scheduled notifications', async () => {
    const mockScheduled = [
      { identifier: '1', content: {} },
      { identifier: '2', content: {} },
    ];
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
      mockScheduled
    );

    const { result } = renderHook(() => useNotifications());

    let scheduled;
    await act(async () => {
      scheduled = await result.current.getScheduledNotifications();
    });

    expect(scheduled).toEqual(mockScheduled);
  });
});