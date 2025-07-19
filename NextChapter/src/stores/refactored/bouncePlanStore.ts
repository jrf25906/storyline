import { StateCreator } from 'zustand';
import { 
  BouncePlanStore, 
  BouncePlanStoreState,
  TaskProgress,
  OfflineOperation 
} from '@stores/interfaces/bouncePlanStore';
import { createStore, createInitialState, handleAsyncOperation } from '@stores/factory/createStore';
import { BouncePlanTask } from '@types';
import { 
  loadBouncePlanProgress, 
  syncBouncePlanProgress, 
  batchSyncBouncePlanProgress,
  resetBouncePlanProgress,
  getBouncePlanStats,
  TaskUpdate 
} from '@services/database/bouncePlan';

/**
 * Initial state for bounce plan store
 */
const initialState = createInitialState<Omit<BouncePlanStoreState, 'isLoading' | 'error'>>({
  tasks: [],
  localProgress: {},
  startDate: null,
  currentDay: 1,
  isSyncing: false,
  lastSyncTime: null,
  offlineQueue: [],
});

/**
 * Bounce plan calculations implementation
 * Separated from state management for clarity
 */
const createBouncePlanCalculations: StateCreator<BouncePlanStore, [], [], Pick<BouncePlanStore,
  'getTaskStatus' | 'getCompletedTasksCount' | 'getSkippedTasksCount' | 
  'getCompletionRate' | 'getDaysActive' | 'canAccessTask'
>> = (set, get) => ({
  getTaskStatus: (taskId) => {
    const localProgress = get().localProgress[taskId];
    if (localProgress) return localProgress;
    
    const task = get().tasks.find(t => t.task_id === taskId);
    if (!task) return undefined;
    
    return {
      taskId: task.task_id,
      completed: !!task.completed_at,
      skipped: !!task.skipped_at,
      notes: task.notes,
      completedAt: task.completed_at,
      skippedAt: task.skipped_at,
    };
  },

  getCompletedTasksCount: () => {
    const tasks = get().tasks;
    const localProgress = get().localProgress;
    
    // Count from both database tasks and local progress
    const dbCompleted = tasks.filter(t => t.completed_at).length;
    const localCompleted = Object.values(localProgress).filter(p => p.completed).length;
    
    return dbCompleted + localCompleted;
  },

  getSkippedTasksCount: () => {
    const tasks = get().tasks;
    const localProgress = get().localProgress;
    
    const dbSkipped = tasks.filter(t => t.skipped_at).length;
    const localSkipped = Object.values(localProgress).filter(p => p.skipped).length;
    
    return dbSkipped + localSkipped;
  },

  getCompletionRate: () => {
    const totalTasksAvailable = get().currentDay;
    const completedCount = get().getCompletedTasksCount();
    
    if (totalTasksAvailable === 0) return 0;
    
    return Math.round((completedCount / totalTasksAvailable) * 100);
  },

  getDaysActive: () => {
    const startDate = get().startDate;
    if (!startDate) return 0;
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.min(diffDays, 30); // Cap at 30 days
  },

  canAccessTask: (dayNumber) => {
    const currentDay = get().currentDay;
    const daysActive = get().getDaysActive();
    
    // Users can access current day and all previous days
    return dayNumber <= Math.max(currentDay, daysActive);
  },
});

/**
 * Task operations implementation
 * Handles task-related actions
 */
const createTaskOperations: StateCreator<BouncePlanStore, [], [], Pick<BouncePlanStore,
  'loadProgress' | 'completeTask' | 'skipTask' | 'undoTaskAction' | 'syncProgress' | 'resetProgress'
>> = (set, get) => ({
  loadProgress: async (userId) => {
    await handleAsyncOperation(
      set,
      async () => {
        const progress = await loadBouncePlanProgress(userId);
        
        // Set the startDate first
        const startDate = progress.startDate || new Date();
        set({ startDate });
        
        // Now calculate currentDay
        const currentDay = progress.startDate 
          ? Math.min(get().getDaysActive() + 1, 30)
          : 1;
        
        set({ 
          tasks: progress.tasks,
          currentDay,
        });
        
        return progress;
      },
      {
        onError: (error) => {
          console.error('Error loading bounce plan progress:', error);
        }
      }
    );
  },

  completeTask: async (userId, taskId, notes) => {
    const timestamp = new Date().toISOString();
    
    // Optimistic update
    get().updateLocalProgress(taskId, {
      completed: true,
      skipped: false,
      completedAt: timestamp,
      notes,
    });
    
    try {
      const update: TaskUpdate = {
        taskId,
        completed: true,
        skipped: false,
        notes,
      };
      
      const success = await syncBouncePlanProgress(userId, update);
      
      if (!success) {
        throw new Error('Failed to sync task completion');
      }
      
      // Reload to get updated data
      await get().loadProgress(userId);
    } catch (error) {
      console.error('Error completing task:', error);
      // Revert optimistic update
      get().updateLocalProgress(taskId, {
        completed: false,
        completedAt: undefined,
      });
      set({ error: error instanceof Error ? error.message : 'Failed to complete task' });
      throw error;
    }
  },

  skipTask: async (userId, taskId, notes) => {
    const timestamp = new Date().toISOString();
    
    // Optimistic update
    get().updateLocalProgress(taskId, {
      skipped: true,
      completed: false,
      skippedAt: timestamp,
      notes,
    });
    
    try {
      const update: TaskUpdate = {
        taskId,
        completed: false,
        skipped: true,
        notes,
      };
      
      const success = await syncBouncePlanProgress(userId, update);
      
      if (!success) {
        throw new Error('Failed to sync task skip');
      }
      
      // Reload to get updated data
      await get().loadProgress(userId);
    } catch (error) {
      console.error('Error skipping task:', error);
      // Revert optimistic update
      get().updateLocalProgress(taskId, {
        skipped: false,
        skippedAt: undefined,
      });
      set({ error: error instanceof Error ? error.message : 'Failed to skip task' });
      throw error;
    }
  },

  undoTaskAction: async (userId, taskId) => {
    // Clear local progress
    const { [taskId]: _, ...remainingProgress } = get().localProgress;
    set({ localProgress: remainingProgress });
    
    try {
      const update: TaskUpdate = {
        taskId,
        completed: false,
        skipped: false,
        notes: '',
      };
      
      const success = await syncBouncePlanProgress(userId, update);
      
      if (!success) {
        throw new Error('Failed to undo task action');
      }
      
      // Reload to get updated data
      await get().loadProgress(userId);
    } catch (error) {
      console.error('Error undoing task action:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to undo task action' });
      throw error;
    }
  },

  syncProgress: async (userId) => {
    set({ isSyncing: true, error: null });
    try {
      const localProgress = get().localProgress;
      
      if (Object.keys(localProgress).length > 0) {
        const updates: TaskUpdate[] = Object.entries(localProgress).map(([taskId, progress]) => ({
          taskId,
          completed: progress.completed,
          skipped: progress.skipped,
          notes: progress.notes,
        }));
        
        const success = await batchSyncBouncePlanProgress(userId, updates);
        
        if (success) {
          set({ 
            localProgress: {},
            lastSyncTime: new Date(),
          });
        }
      }
      
      // Reload to ensure consistency
      await get().loadProgress(userId);
      set({ isSyncing: false });
    } catch (error) {
      console.error('Error syncing progress:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sync progress',
        isSyncing: false 
      });
    }
  },

  resetProgress: async (userId) => {
    await handleAsyncOperation(
      set,
      async () => {
        const success = await resetBouncePlanProgress(userId);
        
        if (!success) {
          throw new Error('Failed to reset progress');
        }
        
        set({
          tasks: [],
          localProgress: {},
          startDate: new Date(),
          currentDay: 1,
          lastSyncTime: null,
        });
      },
      {
        onError: (error) => {
          console.error('Error resetting progress:', error);
          throw error;
        }
      }
    );
  },
});

/**
 * Local state operations implementation
 */
const createLocalStateOperations: StateCreator<BouncePlanStore, [], [], Pick<BouncePlanStore,
  'setCurrentDay' | 'updateLocalProgress' | 'clearLocalProgress'
>> = (set, get) => ({
  setCurrentDay: (day) => {
    set({ currentDay: Math.min(Math.max(1, day), 30) });
  },

  updateLocalProgress: (taskId, progress) => {
    set((state) => ({
      localProgress: {
        ...state.localProgress,
        [taskId]: {
          taskId,
          ...state.localProgress[taskId],
          ...progress,
        },
      },
    }));
  },

  clearLocalProgress: () => {
    set({ localProgress: {} });
  },
});

/**
 * Offline queue operations implementation
 */
const createOfflineQueueOperations: StateCreator<BouncePlanStore, [], [], Pick<BouncePlanStore,
  'addToOfflineQueue' | 'clearOfflineQueue' | 'getOfflineQueueSize' | 
  'getOfflineQueue' | 'processOfflineQueue' | 'getSyncStatus'
>> = (set, get) => ({
  addToOfflineQueue: (operation) => {
    set((state) => ({
      offlineQueue: [
        ...state.offlineQueue,
        {
          ...operation,
          id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        },
      ],
    }));
  },
  
  clearOfflineQueue: () => {
    set({ offlineQueue: [] });
  },
  
  getOfflineQueueSize: () => {
    return get().offlineQueue.length;
  },
  
  getOfflineQueue: () => {
    return get().offlineQueue;
  },
  
  processOfflineQueue: async (userId) => {
    const queue = get().offlineQueue;
    if (queue.length === 0) return;
    
    const remainingOperations: OfflineOperation[] = [];
    
    for (const operation of queue) {
      try {
        let update: TaskUpdate;
        
        switch (operation.type) {
          case 'complete':
            update = {
              taskId: operation.taskId,
              completed: true,
              skipped: false,
              notes: operation.data?.notes,
            };
            break;
            
          case 'skip':
            update = {
              taskId: operation.taskId,
              completed: false,
              skipped: true,
              notes: operation.data?.notes,
            };
            break;
            
          case 'reopen':
            update = {
              taskId: operation.taskId,
              completed: false,
              skipped: false,
              notes: '',
            };
            break;
        }
        
        const success = await syncBouncePlanProgress(userId, update);
        
        if (!success) {
          // Keep the operation in the queue if sync failed
          remainingOperations.push(operation);
        }
      } catch (error) {
        console.error('Error processing offline operation:', error);
        remainingOperations.push(operation);
      }
    }
    
    // Update queue with only failed operations
    set({ offlineQueue: remainingOperations });
  },
  
  getSyncStatus: () => {
    const state = get();
    return {
      pendingOperations: state.offlineQueue.length,
      lastSync: state.lastSyncTime || undefined,
    };
  },
});

/**
 * Analytics operations implementation
 */
const createAnalyticsOperations: StateCreator<BouncePlanStore, [], [], Pick<BouncePlanStore, 'getStats'>> = (set, get) => ({
  getStats: async (userId) => {
    try {
      const stats = await getBouncePlanStats(userId);
      // Stats can be used for analytics or displayed in UI
      console.log('Bounce plan stats:', stats);
    } catch (error) {
      console.error('Error getting stats:', error);
    }
  },
});

/**
 * Plan management operations implementation
 */
const createPlanManagementOperations: StateCreator<BouncePlanStore, [], [], Pick<BouncePlanStore,
  'initializePlan' | 'syncToDatabase' | 'resetPlan'
>> = (set, get) => ({
  initializePlan: (startDate) => {
    set({
      startDate,
      currentDay: 1,
      tasks: [],
      localProgress: {},
    });
  },
  
  syncToDatabase: async (userId) => {
    try {
      await get().syncProgress(userId);
      return true;
    } catch (error) {
      console.error('Sync to database failed:', error);
      return false;
    }
  },
  
  resetPlan: () => {
    set({
      tasks: [],
      localProgress: {},
      startDate: new Date(),
      currentDay: 1,
      lastSyncTime: null,
    });
  },
});

/**
 * Complete bounce plan store creator
 * Combines all functionality using composition
 */
const bouncePlanStoreCreator: StateCreator<BouncePlanStore, [], [], BouncePlanStore> = (set, get) => ({
  ...initialState,
  ...createBouncePlanCalculations(set, get, {} as any),
  ...createTaskOperations(set, get, {} as any),
  ...createLocalStateOperations(set, get, {} as any),
  ...createOfflineQueueOperations(set, get, {} as any),
  ...createAnalyticsOperations(set, get, {} as any),
  ...createPlanManagementOperations(set, get, {} as any),
  
  // Reset function
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the bounce plan store
 * Using factory pattern for consistent configuration
 */
export const useBouncePlanStore = createStore<BouncePlanStore>(
  bouncePlanStoreCreator,
  {
    name: 'bounce-plan-store',
    persist: true,
    partialize: (state) => ({
      localProgress: state.localProgress,
      currentDay: state.currentDay,
      lastSyncTime: state.lastSyncTime,
      offlineQueue: state.offlineQueue,
    }),
  }
);