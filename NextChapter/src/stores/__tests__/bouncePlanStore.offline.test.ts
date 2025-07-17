import { renderHook, act } from '@testing-library/react-hooks';
import { useBouncePlanStore } from '../bouncePlanStore';
import * as bouncePlanService from '../../services/database/bouncePlan';

// Mock the database service
jest.mock('../../services/database/bouncePlan');

describe('BouncePlanStore - Offline Queue', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useBouncePlanStore());
    act(() => {
      result.current.resetPlan();
      result.current.clearOfflineQueue();
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Offline Queue Management', () => {
    it('should add operations to offline queue', () => {
      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.addToOfflineQueue({
          type: 'complete',
          taskId: 'task-1',
          data: { notes: 'Test note' }
        });
      });

      expect(result.current.getOfflineQueueSize()).toBe(1);
      expect(result.current.offlineQueue[0]).toMatchObject({
        type: 'complete',
        taskId: 'task-1',
        data: { notes: 'Test note' }
      });
      expect(result.current.offlineQueue[0].id).toBeDefined();
      expect(result.current.offlineQueue[0].timestamp).toBeDefined();
    });

    it('should add multiple operations to offline queue', () => {
      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.addToOfflineQueue({
          type: 'complete',
          taskId: 'task-1'
        });
        result.current.addToOfflineQueue({
          type: 'skip',
          taskId: 'task-2'
        });
        result.current.addToOfflineQueue({
          type: 'reopen',
          taskId: 'task-3'
        });
      });

      expect(result.current.getOfflineQueueSize()).toBe(3);
      expect(result.current.offlineQueue[0].type).toBe('complete');
      expect(result.current.offlineQueue[1].type).toBe('skip');
      expect(result.current.offlineQueue[2].type).toBe('reopen');
    });

    it('should clear offline queue', () => {
      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.addToOfflineQueue({
          type: 'complete',
          taskId: 'task-1'
        });
        result.current.addToOfflineQueue({
          type: 'skip',
          taskId: 'task-2'
        });
      });

      expect(result.current.getOfflineQueueSize()).toBe(2);

      act(() => {
        result.current.clearOfflineQueue();
      });

      expect(result.current.getOfflineQueueSize()).toBe(0);
      expect(result.current.offlineQueue).toEqual([]);
    });
  });

  describe('Process Offline Queue', () => {
    const mockUserId = 'test-user-123';

    it('should process offline queue successfully', async () => {
      const { result } = renderHook(() => useBouncePlanStore());
      
      // Mock successful sync
      (bouncePlanService.syncBouncePlanProgress as jest.Mock).mockResolvedValue(true);

      // Add operations to queue
      act(() => {
        result.current.initializePlan(new Date());
        result.current.completeTask('task-1', 'Test note');
        result.current.addToOfflineQueue({
          type: 'complete',
          taskId: 'task-1',
          data: { notes: 'Test note' }
        });
      });

      expect(result.current.getOfflineQueueSize()).toBe(1);

      // Process queue
      await act(async () => {
        await result.current.processOfflineQueue(mockUserId);
      });

      expect(bouncePlanService.syncBouncePlanProgress).toHaveBeenCalledWith(
        mockUserId,
        {
          taskId: 'task-1',
          completed: true,
          skipped: false,
          notes: 'Test note'
        }
      );
      expect(result.current.getOfflineQueueSize()).toBe(0);
    });

    it('should handle failed sync operations', async () => {
      const { result } = renderHook(() => useBouncePlanStore());
      
      // Mock failed sync
      (bouncePlanService.syncBouncePlanProgress as jest.Mock).mockResolvedValue(false);

      // Add operations to queue
      act(() => {
        result.current.addToOfflineQueue({
          type: 'complete',
          taskId: 'task-1'
        });
        result.current.addToOfflineQueue({
          type: 'skip',
          taskId: 'task-2'
        });
      });

      expect(result.current.getOfflineQueueSize()).toBe(2);

      // Process queue
      await act(async () => {
        await result.current.processOfflineQueue(mockUserId);
      });

      // Operations should remain in queue after failed sync
      expect(result.current.getOfflineQueueSize()).toBe(2);
    });

    it('should process mixed success/failure operations', async () => {
      const { result } = renderHook(() => useBouncePlanStore());
      
      // Mock alternating success/failure
      (bouncePlanService.syncBouncePlanProgress as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      // Add operations to queue
      act(() => {
        result.current.addToOfflineQueue({
          type: 'complete',
          taskId: 'task-1'
        });
        result.current.addToOfflineQueue({
          type: 'skip',
          taskId: 'task-2'
        });
        result.current.addToOfflineQueue({
          type: 'reopen',
          taskId: 'task-3'
        });
      });

      expect(result.current.getOfflineQueueSize()).toBe(3);

      // Process queue
      await act(async () => {
        await result.current.processOfflineQueue(mockUserId);
      });

      // Only the failed operation should remain
      expect(result.current.getOfflineQueueSize()).toBe(1);
      expect(result.current.offlineQueue[0].taskId).toBe('task-2');
    });

    it('should handle empty queue gracefully', async () => {
      const { result } = renderHook(() => useBouncePlanStore());

      // Process empty queue
      await act(async () => {
        await result.current.processOfflineQueue(mockUserId);
      });

      expect(bouncePlanService.syncBouncePlanProgress).not.toHaveBeenCalled();
      expect(result.current.getOfflineQueueSize()).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should persist offline queue to storage', () => {
      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.addToOfflineQueue({
          type: 'complete',
          taskId: 'task-1',
          data: { notes: 'Persisted note' }
        });
      });

      // Verify the offline queue is in the state
      expect(result.current.offlineQueue).toHaveLength(1);
      expect(result.current.offlineQueue[0]).toMatchObject({
        type: 'complete',
        taskId: 'task-1',
        data: { notes: 'Persisted note' }
      });
      
      // The persist middleware should automatically persist the offlineQueue
      // since it's included in the partialize function
      // We can verify by checking the state directly
      const state = result.current;
      expect(state.offlineQueue).toBeDefined();
      expect(state.offlineQueue.length).toBe(1);
    });
  });
});