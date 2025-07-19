import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { 
  useOfflineStore, 
  setActionProcessor, 
  createOfflineAction,
  usePendingOfflineActions,
  useFailedOfflineActions
} from '@stores/refactored/offlineStore';
import { OfflineActionType, IActionProcessor, OfflineAction } from '@stores/interfaces/offlineStore';

// Mock action processor for testing
class MockActionProcessor implements IActionProcessor {
  processedActions: OfflineAction[] = [];
  shouldFail = false;
  failureMessage = 'Mock failure';

  async process(action: OfflineAction): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }
    this.processedActions.push(action);
  }

  reset() {
    this.processedActions = [];
    this.shouldFail = false;
    this.failureMessage = 'Mock failure';
  }
}

describe('offlineStore', () => {
  let mockProcessor: MockActionProcessor;

  beforeEach(() => {
    // Reset store
    const { result } = renderHook(() => useOfflineStore());
    act(() => {
      result.current.reset();
    });

    // Setup mock processor
    mockProcessor = new MockActionProcessor();
    setActionProcessor(mockProcessor);
  });

  describe('Network Status Operations', () => {
    it('should set online status', () => {
      const { result } = renderHook(() => useOfflineStore());

      expect(result.current.isOnline).toBe(true);

      act(() => {
        result.current.setOnlineStatus(false);
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should auto-sync when coming back online with queued actions', async () => {
      const { result } = renderHook(() => useOfflineStore());

      // Go offline and add action
      act(() => {
        result.current.setOnlineStatus(false);
        result.current.addToQueue({
          type: OfflineActionType.COMPLETE_TASK,
          payload: { taskId: '123' },
        });
      });

      expect(result.current.queue).toHaveLength(1);

      // Go back online
      act(() => {
        result.current.setOnlineStatus(true);
      });

      // Wait for auto-sync
      await waitFor(() => {
        expect(mockProcessor.processedActions).toHaveLength(1);
        expect(result.current.queue).toHaveLength(0);
      });
    });
  });

  describe('Queue Operations', () => {
    it('should add action to queue', () => {
      const { result } = renderHook(() => useOfflineStore());

      const action = createOfflineAction(
        OfflineActionType.UPDATE_BUDGET,
        { amount: 1000 }
      );

      act(() => {
        result.current.addToQueue(action);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]).toMatchObject({
        type: OfflineActionType.UPDATE_BUDGET,
        payload: { amount: 1000 },
        retryCount: 0,
      });
      expect(result.current.queue[0].id).toBeDefined();
      expect(result.current.queue[0].timestamp).toBeDefined();
    });

    it('should remove action from queue', () => {
      const { result } = renderHook(() => useOfflineStore());

      // Add multiple actions
      act(() => {
        result.current.addToQueue({
          type: OfflineActionType.ADD_JOB_APPLICATION,
          payload: { jobId: '1' },
        });
        result.current.addToQueue({
          type: OfflineActionType.ADD_JOB_APPLICATION,
          payload: { jobId: '2' },
        });
      });

      const actionToRemove = result.current.queue[0].id;

      act(() => {
        result.current.removeFromQueue(actionToRemove);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].payload.jobId).toBe('2');
    });

    it('should clear entire queue', () => {
      const { result } = renderHook(() => useOfflineStore());

      // Add multiple actions
      act(() => {
        result.current.addToQueue({
          type: OfflineActionType.UPDATE_MOOD,
          payload: { mood: 'happy' },
        });
        result.current.addToQueue({
          type: OfflineActionType.SAVE_COACH_MESSAGE,
          payload: { message: 'test' },
        });
      });

      expect(result.current.queue).toHaveLength(2);

      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queue).toHaveLength(0);
    });

    it('should get queue size', () => {
      const { result } = renderHook(() => useOfflineStore());

      expect(result.current.getQueueSize()).toBe(0);

      act(() => {
        result.current.addToQueue({
          type: OfflineActionType.UPDATE_PROFILE,
          payload: { name: 'Test' },
        });
      });

      expect(result.current.getQueueSize()).toBe(1);
    });
  });

  describe('Sync Operations', () => {
    it('should process queue successfully', async () => {
      const { result } = renderHook(() => useOfflineStore());

      // Add actions
      act(() => {
        result.current.addToQueue({
          type: OfflineActionType.COMPLETE_TASK,
          payload: { taskId: '1' },
        });
        result.current.addToQueue({
          type: OfflineActionType.UPDATE_BUDGET,
          payload: { amount: 500 },
        });
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.processQueue();
      });

      expect(syncResult).toEqual({
        success: true,
        syncedCount: 2,
        failedCount: 0,
      });
      expect(result.current.queue).toHaveLength(0);
      expect(mockProcessor.processedActions).toHaveLength(2);
    });

    it('should handle failed actions with retry', async () => {
      const { result } = renderHook(() => useOfflineStore());

      // Make processor fail
      mockProcessor.shouldFail = true;

      act(() => {
        result.current.addToQueue({
          type: OfflineActionType.SYNC_WELLNESS_ACTIVITY,
          payload: { activity: 'meditation' },
        });
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.processQueue();
      });

      expect(syncResult).toMatchObject({
        success: false,
        syncedCount: 0,
        failedCount: 1,
      });
      expect(syncResult.errors).toBeDefined();
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].retryCount).toBe(1);
    });

    it('should remove actions after max retry attempts', async () => {
      const { result } = renderHook(() => useOfflineStore());

      // Make processor always fail
      mockProcessor.shouldFail = true;

      act(() => {
        result.current.addToQueue({
          type: OfflineActionType.UPDATE_MOOD,
          payload: { mood: 'anxious' },
        });
      });

      // Process multiple times to exceed retry limit
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          await result.current.processQueue();
        });
      }

      // Action should be removed after max retries
      expect(result.current.queue).toHaveLength(0);
    });

    it('should retry failed actions', async () => {
      const { result } = renderHook(() => useOfflineStore());

      // Add action with retry count
      act(() => {
        result.current.addToQueue({
          type: OfflineActionType.ADD_JOB_APPLICATION,
          payload: { jobId: '123' },
        });
      });

      // Make first attempt fail
      mockProcessor.shouldFail = true;
      await act(async () => {
        await result.current.processQueue();
      });

      expect(result.current.queue[0].retryCount).toBe(1);

      // Make processor succeed
      mockProcessor.shouldFail = false;

      let retryResult;
      await act(async () => {
        retryResult = await result.current.retryFailedActions();
      });

      expect(retryResult).toMatchObject({
        success: true,
        syncedCount: 1,
        failedCount: 0,
      });
      expect(result.current.queue).toHaveLength(0);
    });

    it('should handle offline status during processQueue', async () => {
      const { result } = renderHook(() => useOfflineStore());

      // Go offline
      act(() => {
        result.current.setOnlineStatus(false);
        result.current.addToQueue({
          type: OfflineActionType.COMPLETE_TASK,
          payload: { taskId: '456' },
        });
      });

      let syncResult;
      await act(async () => {
        syncResult = await result.current.processQueue();
      });

      expect(syncResult).toEqual({
        success: true,
        syncedCount: 0,
        failedCount: 0,
      });
      expect(result.current.queue).toHaveLength(1);
      expect(mockProcessor.processedActions).toHaveLength(0);
    });
  });

  describe('Utility Hooks', () => {
    it('should detect pending offline actions', () => {
      const { result: storeResult } = renderHook(() => useOfflineStore());
      const { result: pendingResult } = renderHook(() => usePendingOfflineActions());

      expect(pendingResult.current).toBe(false);

      act(() => {
        storeResult.current.addToQueue({
          type: OfflineActionType.UPDATE_PROFILE,
          payload: { bio: 'Updated bio' },
        });
      });

      const { result: pendingResult2 } = renderHook(() => usePendingOfflineActions());
      expect(pendingResult2.current).toBe(true);
    });

    it('should get failed offline actions', () => {
      const { result: storeResult } = renderHook(() => useOfflineStore());
      const { result: failedResult } = renderHook(() => useFailedOfflineActions());

      expect(failedResult.current).toHaveLength(0);

      // Add action with retry count
      act(() => {
        const action = {
          type: OfflineActionType.SAVE_COACH_MESSAGE,
          payload: { message: 'Help' },
        };
        storeResult.current.addToQueue(action);
      });

      // Manually set retry count (simulating failed sync)
      act(() => {
        storeResult.current.queue[0].retryCount = 2;
      });

      const { result: failedResult2 } = renderHook(() => useFailedOfflineActions());
      expect(failedResult2.current).toHaveLength(1);
      expect(failedResult2.current[0].retryCount).toBe(2);
    });
  });

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useOfflineStore());

      // Modify state
      act(() => {
        result.current.setOnlineStatus(false);
        result.current.addToQueue({
          type: OfflineActionType.COMPLETE_TASK,
          payload: { taskId: '789' },
        });
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.queue).toHaveLength(1);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.queue).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});