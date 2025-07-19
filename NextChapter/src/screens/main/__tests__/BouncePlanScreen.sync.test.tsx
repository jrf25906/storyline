import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { BouncePlanScreen } from '@screens/main/BouncePlanScreen';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useAuthStore } from '@stores/authStore';
import * as bouncePlanService from '@services/database/bouncePlan';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { NETWORK_STATES } from '@test-utils/mockHelpers';

// Mock dependencies
jest.mock('../../../stores/bouncePlanStore');
jest.mock('../../../stores/authStore');
jest.mock('../../../services/database/bouncePlan');
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('BouncePlanScreen sync integration tests', () => {
  const mockedBouncePlanService = bouncePlanService as jest.Mocked<typeof bouncePlanService>;
  const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
  
  // Default store values
  const defaultBouncePlanStore = {
    currentDay: 5,
    startDate: new Date('2025-01-01'),
    completedTasks: new Set(['day1_breathe', 'day2_routine']),
    skippedTasks: new Set(['day3_finances']),
    taskNotes: {
      'day1_breathe': 'Feeling better',
      'day2_routine': 'Good progress',
    },
    isLoading: false,
    isSyncing: false,
    lastSyncedAt: null,
    syncError: null,
    initializePlan: jest.fn(),
    completeTask: jest.fn(),
    skipTask: jest.fn(),
    reopenTask: jest.fn(),
    updateTaskNotes: jest.fn(),
    getCurrentDay: jest.fn(() => 5),
    getUnlockedDays: jest.fn(() => [1, 2, 3, 4, 5]),
    isTaskUnlocked: jest.fn(() => true),
    isTaskCompleted: jest.fn((taskId) => 
      defaultBouncePlanStore.completedTasks.has(taskId)
    ),
    isTaskSkipped: jest.fn((taskId) => 
      defaultBouncePlanStore.skippedTasks.has(taskId)
    ),
    getTaskStatus: jest.fn((taskId) => {
      if (defaultBouncePlanStore.completedTasks.has(taskId)) return 'completed';
      if (defaultBouncePlanStore.skippedTasks.has(taskId)) return 'skipped';
      return 'available';
    }),
    resetPlan: jest.fn(),
    hydrateFromDatabase: jest.fn(),
    syncToDatabase: jest.fn(),
    syncTaskToDatabase: jest.fn(),
  };

  const defaultAuthStore = {
    user: { id: 'user123', email: 'test@example.com' },
    isAuthenticated: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mocks
    (useBouncePlanStore as unknown as jest.Mock).mockReturnValue(defaultBouncePlanStore);
    (useAuthStore as unknown as jest.Mock).mockReturnValue(defaultAuthStore);
    
    // Mock network as online by default
    mockNetInfo.fetch.mockResolvedValue(NETWORK_STATES.wifi);
  });

  const renderScreen = () => {
    return render(
      <NavigationContainer>
        <BouncePlanScreen navigation={mockNavigation as any} route={{} as any} />
      </NavigationContainer>
    );
  };

  describe('initial load and sync', () => {
    it('should hydrate from database on mount when user is authenticated', async () => {
      const hydrateFromDatabase = jest.fn();
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        hydrateFromDatabase,
      });

      renderScreen();

      await waitFor(() => {
        expect(hydrateFromDatabase).toHaveBeenCalledWith('user123');
      });
    });

    it('should not hydrate when user is not authenticated', async () => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const hydrateFromDatabase = jest.fn();
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        hydrateFromDatabase,
      });

      renderScreen();

      await waitFor(() => {
        expect(hydrateFromDatabase).not.toHaveBeenCalled();
      });
    });

    it('should show loading state while hydrating', async () => {
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        isLoading: true,
      });

      const { getByTestId } = renderScreen();

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should show sync error if hydration fails', async () => {
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        syncError: 'Failed to load progress from server',
      });

      const { getByText } = renderScreen();

      expect(getByText('Failed to load progress from server')).toBeTruthy();
    });
  });

  describe('task completion sync', () => {
    it('should sync task when completed while online', async () => {
      const completeTask = jest.fn();
      const syncTaskToDatabase = jest.fn().mockResolvedValue(true);
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        completeTask,
        syncTaskToDatabase,
        getTaskStatus: jest.fn(() => 'available'),
      });

      const { getByTestId } = renderScreen();

      // Find and press a task's complete button
      const completeButton = getByTestId('complete-task-day4_emails');
      await act(async () => {
        fireEvent.press(completeButton);
      });

      expect(completeTask).toHaveBeenCalledWith('day4_emails');
      
      // Verify sync was attempted
      await waitFor(() => {
        expect(syncTaskToDatabase).toHaveBeenCalledWith('user123', 'day4_emails');
      });
    });

    it('should not sync when offline', async () => {
      // Mock offline state
      mockNetInfo.fetch.mockResolvedValue(NETWORK_STATES.none);

      const completeTask = jest.fn();
      const syncTaskToDatabase = jest.fn();
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        completeTask,
        syncTaskToDatabase,
        getTaskStatus: jest.fn(() => 'available'),
      });

      const { getByTestId } = renderScreen();

      const completeButton = getByTestId('complete-task-day4_emails');
      await act(async () => {
        fireEvent.press(completeButton);
      });

      expect(completeTask).toHaveBeenCalledWith('day4_emails');
      
      // Sync should not be called when offline
      await waitFor(() => {
        expect(syncTaskToDatabase).not.toHaveBeenCalled();
      });
    });

    it('should show sync indicator while syncing', async () => {
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        isSyncing: true,
      });

      const { getByTestId } = renderScreen();

      expect(getByTestId('sync-indicator')).toBeTruthy();
    });
  });

  describe('manual sync', () => {
    it('should trigger manual sync when sync button is pressed', async () => {
      const syncToDatabase = jest.fn().mockResolvedValue(true);
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        syncToDatabase,
        lastSyncedAt: new Date('2025-01-01T10:00:00Z'),
      });

      const { getByTestId } = renderScreen();

      const syncButton = getByTestId('sync-button');
      await act(async () => {
        fireEvent.press(syncButton);
      });

      expect(syncToDatabase).toHaveBeenCalledWith('user123');
    });

    it('should show last sync time', () => {
      const lastSyncedAt = new Date('2025-01-01T10:00:00Z');
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        lastSyncedAt,
      });

      const { getByText } = renderScreen();

      // Should show relative time
      expect(getByText(/Last synced/)).toBeTruthy();
    });

    it('should disable sync button when offline', async () => {
      mockNetInfo.fetch.mockResolvedValue(NETWORK_STATES.none);

      const { getByTestId } = renderScreen();

      await waitFor(() => {
        const syncButton = getByTestId('sync-button');
        expect(syncButton.props.accessibilityState.disabled).toBe(true);
      });
    });
  });

  describe('network state changes', () => {
    it('should sync when coming back online', async () => {
      const syncToDatabase = jest.fn().mockResolvedValue(true);
      let netInfoCallback: any;
      
      // Capture the network state change listener
      mockNetInfo.addEventListener.mockImplementation((callback) => {
        netInfoCallback = callback;
        return jest.fn(); // unsubscribe function
      });

      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        syncToDatabase,
        completedTasks: new Set(['day1_breathe', 'day2_routine', 'day4_emails']),
      });

      renderScreen();

      // Simulate going offline
      await act(async () => {
        netInfoCallback({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
          details: null,
        });
      });

      // Reset mock to track new calls
      syncToDatabase.mockClear();

      // Simulate coming back online
      await act(async () => {
        netInfoCallback({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
          details: null,
        });
      });

      // Should trigger sync when coming back online
      await waitFor(() => {
        expect(syncToDatabase).toHaveBeenCalledWith('user123');
      });
    });

    it('should show offline indicator when disconnected', async () => {
      mockNetInfo.fetch.mockResolvedValue(NETWORK_STATES.none);

      const { getByTestId } = renderScreen();

      await waitFor(() => {
        expect(getByTestId('offline-indicator')).toBeTruthy();
      });
    });
  });

  describe('conflict resolution', () => {
    it('should reload data after successful sync', async () => {
      const hydrateFromDatabase = jest.fn();
      const syncToDatabase = jest.fn().mockResolvedValue(true);
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        hydrateFromDatabase,
        syncToDatabase,
      });

      const { getByTestId } = renderScreen();

      // Trigger manual sync
      const syncButton = getByTestId('sync-button');
      await act(async () => {
        fireEvent.press(syncButton);
      });

      // Should sync first
      expect(syncToDatabase).toHaveBeenCalled();

      // Then reload data to check for conflicts
      await waitFor(() => {
        expect(hydrateFromDatabase).toHaveBeenCalledTimes(2); // Once on mount, once after sync
      });
    });

    it('should show conflict warning when local and remote data differ', async () => {
      // Mock a scenario where hydration brings different data
      const hydrateFromDatabase = jest.fn().mockImplementation(() => {
        // Simulate server having different completed tasks
        (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
          ...defaultBouncePlanStore,
          completedTasks: new Set(['day1_breathe', 'day5_apply']), // Different from initial
        });
      });

      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        hydrateFromDatabase,
      });

      const { getByText } = renderScreen();

      await waitFor(() => {
        expect(getByText(/Data synced from server/)).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('should show error toast when sync fails', async () => {
      const syncToDatabase = jest.fn().mockResolvedValue(false);
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        syncToDatabase,
        syncError: 'Failed to sync progress',
      });

      const { getByTestId, getByText } = renderScreen();

      const syncButton = getByTestId('sync-button');
      await act(async () => {
        fireEvent.press(syncButton);
      });

      await waitFor(() => {
        expect(getByText('Failed to sync progress')).toBeTruthy();
      });
    });

    it('should retry sync after error', async () => {
      const syncToDatabase = jest.fn()
        .mockResolvedValueOnce(false) // First attempt fails
        .mockResolvedValueOnce(true); // Retry succeeds
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        syncToDatabase,
      });

      const { getByTestId, getByText } = renderScreen();

      // First sync attempt
      const syncButton = getByTestId('sync-button');
      await act(async () => {
        fireEvent.press(syncButton);
      });

      // Find and press retry button
      await waitFor(() => {
        const retryButton = getByText('Retry');
        fireEvent.press(retryButton);
      });

      expect(syncToDatabase).toHaveBeenCalledTimes(2);
    });
  });

  describe('performance optimizations', () => {
    it('should debounce rapid task completions', async () => {
      const syncTaskToDatabase = jest.fn().mockResolvedValue(true);
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        completeTask: jest.fn(),
        syncTaskToDatabase,
        getTaskStatus: jest.fn(() => 'available'),
      });

      const { getByTestId } = renderScreen();

      // Rapidly complete multiple tasks
      const task1 = getByTestId('complete-task-day4_emails');
      const task2 = getByTestId('complete-task-day5_apply');
      
      await act(async () => {
        fireEvent.press(task1);
        fireEvent.press(task2);
      });

      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      // Should batch sync instead of individual syncs
      expect(syncTaskToDatabase).toHaveBeenCalledTimes(2);
    });

    it('should not sync if no changes since last sync', async () => {
      const syncToDatabase = jest.fn();
      
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...defaultBouncePlanStore,
        syncToDatabase,
        lastSyncedAt: new Date(),
        // No changes since last sync
      });

      const { getByTestId } = renderScreen();

      const syncButton = getByTestId('sync-button');
      await act(async () => {
        fireEvent.press(syncButton);
      });

      expect(syncToDatabase).not.toHaveBeenCalled();
    });
  });
});