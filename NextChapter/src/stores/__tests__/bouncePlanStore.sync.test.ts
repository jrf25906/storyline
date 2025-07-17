import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { useBouncePlanStore } from '../bouncePlanStore';
import * as bouncePlanService from '../../services/database/bouncePlan';
import { waitForAsync, testLoadingState, testAsyncError } from '../../test-utils/asyncHelpers';

// Mock the database service
jest.mock('../../services/database/bouncePlan');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('bouncePlanStore sync functionality', () => {
  const mockedBouncePlanService = bouncePlanService as jest.Mocked<typeof bouncePlanService>;
  const mockUserId = 'test-user-123';

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset store to initial state
    await act(async () => {
      useBouncePlanStore.setState({
        tasks: [],
        localProgress: {},
        startDate: null,
        currentDay: 1,
        isLoading: false,
        isSyncing: false,
        error: null,
        lastSyncTime: null,
      });
    });
  });

  describe('loadProgress', () => {
    it('should load progress from database successfully', async () => {
      const mockProgress = {
        tasks: [
          {
            id: '1',
            user_id: mockUserId,
            day_number: 1,
            task_id: 'day1_breathe',
            completed_at: '2025-01-01T10:00:00Z',
            skipped_at: null,
            notes: 'Feeling better',
            created_at: '2025-01-01T09:00:00Z',
          },
          {
            id: '2',
            user_id: mockUserId,
            day_number: 2,
            task_id: 'day2_routine',
            completed_at: null,
            skipped_at: '2025-01-02T10:00:00Z',
            notes: null,
            created_at: '2025-01-01T09:00:00Z',
          },
          {
            id: '3',
            user_id: mockUserId,
            day_number: 3,
            task_id: 'day3_finances',
            completed_at: '2025-01-03T10:00:00Z',
            skipped_at: null,
            notes: 'Reviewed budget',
            created_at: '2025-01-01T09:00:00Z',
          },
        ],
        startDate: new Date('2025-01-01'),
      };

      mockedBouncePlanService.loadBouncePlanProgress.mockResolvedValue(mockProgress);

      const { result } = renderHook(() => useBouncePlanStore());

      await act(async () => {
        await result.current.loadProgress(mockUserId);
      });

      // Wait for state updates
      await waitForAsync();

      // Check tasks are loaded
      expect(result.current.tasks).toEqual(mockProgress.tasks);
      
      // Check task status using getTaskStatus
      const task1Status = result.current.getTaskStatus('day1_breathe');
      expect(task1Status?.completed).toBe(true);
      expect(task1Status?.skipped).toBe(false);
      expect(task1Status?.notes).toBe('Feeling better');
      
      const task2Status = result.current.getTaskStatus('day2_routine');
      expect(task2Status?.completed).toBe(false);
      expect(task2Status?.skipped).toBe(true);
      
      const task3Status = result.current.getTaskStatus('day3_finances');
      expect(task3Status?.completed).toBe(true);
      expect(task3Status?.notes).toBe('Reviewed budget');
      
      expect(result.current.startDate).toEqual(mockProgress.startDate);
      expect(result.current.lastSyncTime).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle empty progress from database', async () => {
      mockedBouncePlanService.loadBouncePlanProgress.mockResolvedValue({
        tasks: [],
        startDate: undefined,
      });

      const { result } = renderHook(() => useBouncePlanStore());
      
      // Set initial state
      const initialDate = new Date('2025-01-05');
      await act(async () => {
        useBouncePlanStore.setState({ startDate: initialDate });
      });

      await act(async () => {
        await result.current.loadProgress(mockUserId);
      });

      await waitForAsync();

      expect(result.current.tasks).toEqual([]);
      expect(result.current.getCompletedTasksCount()).toBe(0);
      expect(result.current.getSkippedTasksCount()).toBe(0);
      expect(result.current.startDate).toEqual(initialDate); // Keeps existing
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database error';
      mockedBouncePlanService.loadBouncePlanProgress.mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useBouncePlanStore());

      await act(async () => {
        try {
          await result.current.loadProgress(mockUserId);
        } catch (error) {
          // Expected to throw
        }
      });

      await waitForAsync();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toContain(errorMessage);
    });

    it('should set loading state correctly', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockedBouncePlanService.loadBouncePlanProgress.mockReturnValue(promise as any);

      const { result } = renderHook(() => useBouncePlanStore());

      // Start the async operation without await
      const loadPromise = result.current.loadProgress(mockUserId);
      
      // Check loading state immediately
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise and wait for completion
      await act(async () => {
        resolvePromise!({ tasks: [], startDate: undefined });
        await loadPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('syncProgress', () => {
    it('should sync all tasks to database successfully', async () => {
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockResolvedValue(true);
      mockedBouncePlanService.syncBouncePlanProgress.mockResolvedValue(true);
      mockedBouncePlanService.loadBouncePlanProgress.mockResolvedValue({ tasks: [], startDate: null });

      const { result } = renderHook(() => useBouncePlanStore());
      const startDate = new Date('2025-01-01');

      // Set initial state
      await act(async () => {
        useBouncePlanStore.setState({ 
          startDate,
          localProgress: {
            'day1_breathe': { 
              taskId: 'day1_breathe', 
              completed: true, 
              skipped: false, 
              notes: 'Morning routine done',
              completedAt: new Date().toISOString()
            },
            'day2_routine': { 
              taskId: 'day2_routine', 
              completed: true, 
              skipped: false,
              completedAt: new Date().toISOString()
            },
            'day3_finances': { 
              taskId: 'day3_finances', 
              completed: false, 
              skipped: true,
              skippedAt: new Date().toISOString()
            }
          }
        });
      });

      await act(async () => {
        await result.current.syncProgress(mockUserId);
      });

      await waitForAsync();

      expect(mockedBouncePlanService.batchSyncBouncePlanProgress).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([
          expect.objectContaining({
            taskId: 'day1_breathe',
            completed: true,
            skipped: false,
            notes: 'Morning routine done',
          }),
          expect.objectContaining({
            taskId: 'day2_routine',  
            completed: true,
            skipped: false,
          }),
          expect.objectContaining({
            taskId: 'day3_finances',
            completed: false,
            skipped: true,
          }),
        ])
      );

      expect(result.current.lastSyncTime).toBeTruthy();
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle sync failures', async () => {
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockResolvedValue(false);

      const { result } = renderHook(() => useBouncePlanStore());

      // Set up local progress to sync
      await act(async () => {
        useBouncePlanStore.setState({ 
          localProgress: {
            'day1_breathe': { 
              taskId: 'day1_breathe', 
              completed: true, 
              skipped: false,
              completedAt: new Date().toISOString()
            }
          }
        });
      });

      await expect(
        act(async () => {
          await result.current.syncProgress(mockUserId);
        })
      ).rejects.toThrow();
      expect(result.current.syncError).toBe('Failed to sync progress');
      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle sync exceptions', async () => {
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.completeTask('day1_breathe');
      });

      let syncResult: boolean = false;
      await act(async () => {
        syncResult = await result.current.syncToDatabase('user123');
      });

      expect(syncResult).toBe(false);
      expect(result.current.syncError).toBe('Failed to sync progress');
      expect(result.current.isSyncing).toBe(false);
    });

    it('should set syncing state correctly', async () => {
      let resolvePromise: any;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockReturnValue(promise as any);

      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.syncToDatabase('user123');
      });

      expect(result.current.isSyncing).toBe(true);

      await act(async () => {
        resolvePromise(true);
        await promise;
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle empty task list', async () => {
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockResolvedValue(true);

      const { result } = renderHook(() => useBouncePlanStore());

      let syncResult: boolean = false;
      await act(async () => {
        syncResult = await result.current.syncToDatabase('user123');
      });

      expect(syncResult).toBe(true);
      expect(mockedBouncePlanService.batchSyncBouncePlanProgress).toHaveBeenCalledWith(
        'user123',
        []
      );
    });
  });

  describe('syncTaskToDatabase', () => {
    it('should sync single task successfully', async () => {
      mockedBouncePlanService.syncBouncePlanProgress.mockResolvedValue(true);

      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.completeTask('day1_breathe', 'Completed with notes');
      });

      let syncResult: boolean = false;
      await act(async () => {
        syncResult = await result.current.syncTaskToDatabase('user123', 'day1_breathe');
      });

      expect(syncResult).toBe(true);
      expect(mockedBouncePlanService.syncBouncePlanProgress).toHaveBeenCalledWith('user123', {
        taskId: 'day1_breathe',
        completed: true,
        skipped: false,
        notes: 'Completed with notes',
      });
      expect(result.current.lastSyncedAt).toBeTruthy();
    });

    it('should sync skipped task correctly', async () => {
      mockedBouncePlanService.syncBouncePlanProgress.mockResolvedValue(true);

      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.skipTask('day2_routine');
      });

      await act(async () => {
        await result.current.syncTaskToDatabase('user123', 'day2_routine');
      });

      expect(mockedBouncePlanService.syncBouncePlanProgress).toHaveBeenCalledWith('user123', {
        taskId: 'day2_routine',
        completed: false,
        skipped: true,
        notes: undefined,
      });
    });

    it('should handle single task sync failure', async () => {
      mockedBouncePlanService.syncBouncePlanProgress.mockResolvedValue(false);

      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.completeTask('day1_breathe');
      });

      let syncResult: boolean = false;
      await act(async () => {
        syncResult = await result.current.syncTaskToDatabase('user123', 'day1_breathe');
      });

      expect(syncResult).toBe(false);
    });

    it('should handle task not in store', async () => {
      mockedBouncePlanService.syncBouncePlanProgress.mockResolvedValue(true);

      const { result } = renderHook(() => useBouncePlanStore());

      let syncResult: boolean = false;
      await act(async () => {
        syncResult = await result.current.syncTaskToDatabase('user123', 'non_existent_task');
      });

      expect(mockedBouncePlanService.syncBouncePlanProgress).toHaveBeenCalledWith('user123', {
        taskId: 'non_existent_task',
        completed: false,
        skipped: false,
        notes: undefined,
      });
    });

    it('should handle exceptions during sync', async () => {
      mockedBouncePlanService.syncBouncePlanProgress.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.completeTask('day1_breathe');
      });

      let syncResult: boolean = false;
      await act(async () => {
        syncResult = await result.current.syncTaskToDatabase('user123', 'day1_breathe');
      });

      expect(syncResult).toBe(false);
    });
  });

  describe('offline/online sync scenarios', () => {
    it('should queue updates when offline and sync when online', async () => {
      const { result } = renderHook(() => useBouncePlanStore());

      // Simulate offline actions
      act(() => {
        result.current.initializePlan(new Date('2025-01-01'));
        result.current.completeTask('day1_breathe');
        result.current.completeTask('day2_routine');
        result.current.skipTask('day3_finances');
      });

      // Simulate coming online and syncing
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockResolvedValue(true);

      await act(async () => {
        await result.current.syncToDatabase('user123');
      });

      expect(mockedBouncePlanService.batchSyncBouncePlanProgress).toHaveBeenCalledWith(
        'user123',
        expect.arrayContaining([
          expect.objectContaining({ taskId: 'day1_breathe', completed: true }),
          expect.objectContaining({ taskId: 'day2_routine', completed: true }),
          expect.objectContaining({ taskId: 'day3_finances', skipped: true }),
        ])
      );
    });

    it('should handle conflict resolution (last-write-wins)', async () => {
      // Load initial state from database
      mockedBouncePlanService.loadBouncePlanProgress.mockResolvedValue({
        tasks: [
          {
            id: '1',
            user_id: 'user123',
            day_number: 1,
            task_id: 'day1_breathe',
            completed_at: '2025-01-01T10:00:00Z',
            skipped_at: null,
            notes: 'Server notes',
            created_at: '2025-01-01T09:00:00Z',
          },
        ],
        startDate: new Date('2025-01-01'),
      });

      const { result } = renderHook(() => useBouncePlanStore());

      // First, load from database
      await act(async () => {
        await result.current.hydrateFromDatabase('user123');
      });

      expect(result.current.taskNotes['day1_breathe']).toBe('Server notes');

      // Make local changes (should overwrite server state)
      act(() => {
        result.current.completeTask('day1_breathe', 'Local notes override');
      });

      // Sync back to database
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockResolvedValue(true);
      
      await act(async () => {
        await result.current.syncToDatabase('user123');
      });

      // Verify local changes were sent
      expect(mockedBouncePlanService.batchSyncBouncePlanProgress).toHaveBeenCalledWith(
        'user123',
        expect.arrayContaining([
          expect.objectContaining({
            taskId: 'day1_breathe',
            completed: true,
            notes: 'Local notes override',
          }),
        ])
      );
    });

    it('should preserve local changes when hydration fails', async () => {
      mockedBouncePlanService.loadBouncePlanProgress.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useBouncePlanStore());

      // Set local state
      act(() => {
        result.current.initializePlan(new Date('2025-01-01'));
        result.current.completeTask('day1_breathe', 'Local work');
      });

      // Try to hydrate (will fail)
      await act(async () => {
        await result.current.hydrateFromDatabase('user123');
      });

      // Local state should be preserved
      expect(result.current.completedTasks.has('day1_breathe')).toBe(true);
      expect(result.current.taskNotes['day1_breathe']).toBe('Local work');
    });

    it('should handle partial sync failures gracefully', async () => {
      const { result } = renderHook(() => useBouncePlanStore());

      // Create multiple tasks
      act(() => {
        result.current.initializePlan(new Date('2025-01-01'));
        result.current.completeTask('day1_breathe');
        result.current.completeTask('day2_routine');
        result.current.completeTask('day3_finances');
      });

      // Mock partial failure
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockResolvedValue(false);

      let syncResult: boolean = false;
      await act(async () => {
        syncResult = await result.current.syncToDatabase('user123');
      });

      expect(syncResult).toBe(false);
      expect(result.current.syncError).toBe('Failed to sync progress');
      
      // Local state should remain unchanged
      expect(result.current.completedTasks.size).toBe(3);
    });

    it('should handle race conditions during concurrent syncs', async () => {
      const { result } = renderHook(() => useBouncePlanStore());

      act(() => {
        result.current.initializePlan(new Date('2025-01-01'));
        result.current.completeTask('day1_breathe');
      });

      // Create delayed response
      let resolveFirst: any;
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve;
      });
      
      mockedBouncePlanService.batchSyncBouncePlanProgress
        .mockReturnValueOnce(firstPromise as any)
        .mockResolvedValueOnce(true);

      // Start first sync
      act(() => {
        result.current.syncToDatabase('user123');
      });

      // Try to start second sync while first is in progress
      act(() => {
        result.current.syncToDatabase('user123');
      });

      // First sync should be in progress
      expect(result.current.isSyncing).toBe(true);

      // Complete first sync
      await act(async () => {
        resolveFirst(true);
        await firstPromise;
      });

      // Only one sync should have executed
      expect(mockedBouncePlanService.batchSyncBouncePlanProgress).toHaveBeenCalledTimes(1);
    });
  });

  describe('data integrity', () => {
    it('should maintain data consistency across sync operations', async () => {
      const { result } = renderHook(() => useBouncePlanStore());

      // Initial state
      act(() => {
        result.current.initializePlan(new Date('2025-01-01'));
        result.current.completeTask('day1_breathe', 'Initial notes');
      });

      // Sync to database
      mockedBouncePlanService.batchSyncBouncePlanProgress.mockResolvedValue(true);
      await act(async () => {
        await result.current.syncToDatabase('user123');
      });

      // Modify state
      act(() => {
        result.current.updateTaskNotes('day1_breathe', 'Updated notes');
        result.current.completeTask('day2_routine');
      });

      // Load from database (simulating another device's changes)
      mockedBouncePlanService.loadBouncePlanProgress.mockResolvedValue({
        tasks: [
          {
            id: '1',
            user_id: 'user123',
            day_number: 1,
            task_id: 'day1_breathe',
            completed_at: '2025-01-01T10:00:00Z',
            skipped_at: null,
            notes: 'Initial notes',
            created_at: '2025-01-01T09:00:00Z',
          },
          {
            id: '3',
            user_id: 'user123',
            day_number: 3,
            task_id: 'day3_finances',
            completed_at: '2025-01-03T10:00:00Z',
            skipped_at: null,
            notes: 'From other device',
            created_at: '2025-01-01T09:00:00Z',
          },
        ],
        startDate: new Date('2025-01-01'),
      });

      await act(async () => {
        await result.current.hydrateFromDatabase('user123');
      });

      // Check merged state
      expect(result.current.completedTasks.has('day1_breathe')).toBe(true);
      expect(result.current.completedTasks.has('day3_finances')).toBe(true);
      expect(result.current.taskNotes['day1_breathe']).toBe('Initial notes'); // From database
      expect(result.current.taskNotes['day3_finances']).toBe('From other device');
      
      // Local-only changes should be lost (last-write-wins from server)
      expect(result.current.completedTasks.has('day2_routine')).toBe(false);
    });
  });
});