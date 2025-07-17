import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';

// Components
import BouncePlanScreen from '../../screens/main/BouncePlanScreen';
import { OfflineQueueViewer } from '../../components/dev/OfflineQueueViewer';
import { ThemeProvider } from '../../context/ThemeContext';
import { OfflineProvider } from '../../context/OfflineContext';

// Mock network state
const mockNetworkState = {
  isConnected: true,
  type: 'wifi',
  isInternetReachable: true,
};

// Mock stores - create fresh instances for each test
const createMockBouncePlanStore = () => ({
  tasks: [
    {
      id: 'task-1',
      title: 'Take a Breath & Acknowledge',
      day: 1,
      status: 'available',
    },
  ],
  completedTasks: [],
  completeTask: jest.fn(),
  syncOfflineActions: jest.fn(),
  isLoading: false,
});

const createMockOfflineStore = () => ({
  isOnline: true,
  queue: [],
  addToQueue: jest.fn(),
  processQueue: jest.fn(),
  clearQueue: jest.fn(),
  getQueueSize: jest.fn(() => 0),
  retryFailedActions: jest.fn(),
});

let mockBouncePlanStore = createMockBouncePlanStore();
let mockOfflineStore = createMockOfflineStore();

// Mock the stores
jest.mock('../../stores/bouncePlanStore', () => ({
  useBouncePlanStore: () => mockBouncePlanStore,
}));

jest.mock('../../stores/offlineStore', () => ({
  useOfflineStore: () => mockOfflineStore,
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  fetch: jest.fn(() => Promise.resolve(mockNetworkState)),
  __triggerNetworkStateChange: (newState: any) => {
    Object.assign(mockNetworkState, newState);
    // Trigger listeners if needed
  },
}));

// Mock database service
const mockDatabaseService = {
  syncOfflineActions: jest.fn(),
  addOfflineAction: jest.fn(),
  getQueuedActions: jest.fn(() => []),
  clearQueue: jest.fn(),
};

jest.mock('../../services/database', () => ({
  databaseService: mockDatabaseService,
}));

// Mock auth context
const mockAuth = {
  user: { id: 'test-user', email: 'test@example.com' },
  isAuthenticated: true,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  resendVerificationEmail: jest.fn(),
  refreshSession: jest.fn(),
  checkEmailVerification: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <OfflineProvider>
      {children}
    </OfflineProvider>
  </ThemeProvider>
);

describe('Integration: Offline → Online Sync Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset network state
    mockNetworkState.isConnected = true;
    mockNetworkState.isInternetReachable = true;
    
    // Reset store states with fresh instances
    mockOfflineStore = createMockOfflineStore();
    mockBouncePlanStore = createMockBouncePlanStore();
    
    // Reset database service
    mockDatabaseService.getQueuedActions.mockReturnValue([]);
  });

  it('should queue actions when offline and sync when back online', async () => {
    const { getByText, rerender } = render(
      <TestWrapper>
        <BouncePlanScreen />
      </TestWrapper>
    );

    // Step 1: User is online and can see tasks
    await waitFor(() => {
      expect(getByText('Take a Breath & Acknowledge')).toBeTruthy();
    });

    // Step 2: Network goes offline
    await act(async () => {
      mockNetworkState.isConnected = false;
      mockNetworkState.isInternetReachable = false;
      mockOfflineStore.isOnline = false;
      
      // Trigger network state change
      (NetInfo as any).__triggerNetworkStateChange(mockNetworkState);
    });

    // Step 3: User completes task while offline
    const taskCard = getByText('Take a Breath & Acknowledge');
    
    await act(async () => {
      // Mock offline task completion - should be queued
      mockBouncePlanStore.completeTask.mockImplementationOnce(async (taskId) => {
        // Simulate offline behavior - add to queue instead of immediate sync
        const offlineAction = {
          id: 'offline-action-1',
          type: 'COMPLETE_TASK',
          payload: { taskId, completedAt: new Date().toISOString() },
          timestamp: Date.now(),
          retryCount: 0,
        };
        
        mockOfflineStore.queue.push(offlineAction);
        mockOfflineStore.getQueueSize.mockReturnValue(1);
        mockDatabaseService.addOfflineAction.mockResolvedValue(offlineAction);
        
        return { success: true, queued: true };
      });
      
      fireEvent.press(taskCard);
    });

    // Step 4: Verify action was queued
    await waitFor(() => {
      expect(mockDatabaseService.addOfflineAction).toHaveBeenCalledWith({
        type: 'COMPLETE_TASK',
        payload: expect.objectContaining({
          taskId: 'task-1',
          completedAt: expect.any(String),
        }),
      });
    });

    // Step 5: Show offline queue viewer to verify queued action
    rerender(
      <TestWrapper>
        <OfflineQueueViewer />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Offline Queue (1 actions)')).toBeTruthy();
      expect(getByText('COMPLETE_TASK')).toBeTruthy();
    });

    // Step 6: Network comes back online
    await act(async () => {
      mockNetworkState.isConnected = true;
      mockNetworkState.isInternetReachable = true;
      mockOfflineStore.isOnline = true;
      
      // Mock successful sync
      mockDatabaseService.syncOfflineActions.mockResolvedValueOnce({
        success: true,
        syncedCount: 1,
        failedCount: 0,
        results: [
          { id: 'offline-action-1', success: true, error: null },
        ],
      });
      
      // Trigger network state change and auto-sync
      (NetInfo as any).__triggerNetworkStateChange(mockNetworkState);
    });

    // Step 7: Verify sync was triggered
    await waitFor(() => {
      expect(mockDatabaseService.syncOfflineActions).toHaveBeenCalled();
    });

    // Step 8: Verify queue was cleared after successful sync
    await act(async () => {
      mockOfflineStore.queue = [];
      mockOfflineStore.getQueueSize.mockReturnValue(0);
    });

    // Step 9: Verify UI reflects synced state
    rerender(
      <TestWrapper>
        <OfflineQueueViewer />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Offline Queue (0 actions)')).toBeTruthy();
    });
  });

  it('should handle sync failures and retry', async () => {
    // Step 1: Set up offline state with queued action
    await act(async () => {
      mockOfflineStore.queue = [
        {
          id: 'offline-action-1',
          type: 'COMPLETE_TASK',
          payload: { taskId: 'task-1' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];
      mockOfflineStore.getQueueSize.mockReturnValue(1);
    });

    const { getByText } = render(
      <TestWrapper>
        <OfflineQueueViewer />
      </TestWrapper>
    );

    // Step 2: Attempt sync that fails
    await act(async () => {
      mockDatabaseService.syncOfflineActions.mockRejectedValueOnce(
        new Error('Server error')
      );
      
      // Trigger sync
      const syncButton = getByText('Sync Now');
      fireEvent.press(syncButton);
    });

    // Step 3: Verify retry mechanism
    await waitFor(() => {
      expect(mockOfflineStore.retryFailedActions).toHaveBeenCalled();
    });

    // Step 4: Simulate successful retry
    await act(async () => {
      mockDatabaseService.syncOfflineActions.mockResolvedValueOnce({
        success: true,
        syncedCount: 1,
        failedCount: 0,
      });
      
      const retryButton = getByText('Retry Failed');
      fireEvent.press(retryButton);
    });

    // Step 5: Verify successful retry
    await waitFor(() => {
      expect(mockDatabaseService.syncOfflineActions).toHaveBeenCalledTimes(2);
    });
  });

  it('should show offline indicator when network is unavailable', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <BouncePlanScreen />
      </TestWrapper>
    );

    // Step 1: Go offline
    await act(async () => {
      mockNetworkState.isConnected = false;
      mockOfflineStore.isOnline = false;
      (NetInfo as any).__triggerNetworkStateChange(mockNetworkState);
    });

    // Step 2: Verify offline indicator is shown
    await waitFor(() => {
      expect(queryByText('Offline')).toBeTruthy();
      expect(queryByText('Changes will sync when connection is restored')).toBeTruthy();
    });

    // Step 3: Go back online
    await act(async () => {
      mockNetworkState.isConnected = true;
      mockOfflineStore.isOnline = true;
      (NetInfo as any).__triggerNetworkStateChange(mockNetworkState);
    });

    // Step 4: Verify offline indicator is hidden
    await waitFor(() => {
      expect(queryByText('Offline')).toBeFalsy();
    });
  });

  it('should handle partial sync failures', async () => {
    // Set up multiple queued actions
    await act(async () => {
      mockOfflineStore.queue = [
        {
          id: 'action-1',
          type: 'COMPLETE_TASK',
          payload: { taskId: 'task-1' },
          timestamp: Date.now(),
          retryCount: 0,
        },
        {
          id: 'action-2',
          type: 'COMPLETE_TASK',
          payload: { taskId: 'task-2' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ];
      mockOfflineStore.getQueueSize.mockReturnValue(2);
    });

    const { getByText } = render(
      <TestWrapper>
        <OfflineQueueViewer />
      </TestWrapper>
    );

    // Mock partial sync success
    await act(async () => {
      mockDatabaseService.syncOfflineActions.mockResolvedValueOnce({
        success: false,
        syncedCount: 1,
        failedCount: 1,
        results: [
          { id: 'action-1', success: true, error: null },
          { id: 'action-2', success: false, error: 'Network timeout' },
        ],
      });
      
      const syncButton = getByText('Sync Now');
      fireEvent.press(syncButton);
    });

    // Verify partial sync results
    await waitFor(() => {
      expect(getByText('1 synced, 1 failed')).toBeTruthy();
    });

    // Update queue to reflect partial sync
    await act(async () => {
      mockOfflineStore.queue = [
        {
          id: 'action-2',
          type: 'COMPLETE_TASK',
          payload: { taskId: 'task-2' },
          timestamp: Date.now(),
          retryCount: 1,
        },
      ];
      mockOfflineStore.getQueueSize.mockReturnValue(1);
    });

    // Verify failed action remains in queue
    await waitFor(() => {
      expect(getByText('Offline Queue (1 actions)')).toBeTruthy();
    });
  });

  it('should preserve offline actions across app restarts', async () => {
    // Simulate app restart with persisted offline actions
    await act(async () => {
      mockDatabaseService.getQueuedActions.mockReturnValue([
        {
          id: 'persisted-action',
          type: 'COMPLETE_TASK',
          payload: { taskId: 'task-1' },
          timestamp: Date.now() - 60000, // 1 minute ago
          retryCount: 0,
        },
      ]);
      
      mockOfflineStore.queue = mockDatabaseService.getQueuedActions();
      mockOfflineStore.getQueueSize.mockReturnValue(1);
    });

    const { getByText } = render(
      <TestWrapper>
        <OfflineQueueViewer />
      </TestWrapper>
    );

    // Verify persisted actions are loaded
    await waitFor(() => {
      expect(getByText('Offline Queue (1 actions)')).toBeTruthy();
      expect(getByText('COMPLETE_TASK')).toBeTruthy();
    });
  });
});