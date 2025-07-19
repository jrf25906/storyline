import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BouncePlanTask } from '@types/database';
import { 
  loadBouncePlanProgress, 
  syncBouncePlanProgress, 
  batchSyncBouncePlanProgress,
  resetBouncePlanProgress,
  getBouncePlanStats,
  TaskUpdate 
} from '@services/database/bouncePlan';

interface TaskProgress {
  taskId: string;
  completed: boolean;
  skipped: boolean;
  notes?: string;
  completedAt?: string;
  skippedAt?: string;
}

interface OfflineOperation {
  id: string;
  type: 'complete' | 'skip' | 'reopen';
  taskId: string;
  timestamp: Date;
  data?: {
    notes?: string;
  };
}

interface BouncePlanStore {
  // State
  tasks: BouncePlanTask[];
  localProgress: Record<string, TaskProgress>;
  startDate: Date | null;
  currentDay: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  offlineQueue: OfflineOperation[];

  // Computed values
  getTaskStatus: (taskId: string) => TaskProgress | undefined;
  getCompletedTasksCount: () => number;
  getSkippedTasksCount: () => number;
  getCompletionRate: () => number;
  getDaysActive: () => number;
  canAccessTask: (dayNumber: number) => boolean;

  // Actions
  loadProgress: (userId: string) => Promise<void>;
  completeTask: (userId: string, taskId: string, notes?: string) => Promise<void>;
  skipTask: (userId: string, taskId: string, notes?: string) => Promise<void>;
  undoTaskAction: (userId: string, taskId: string) => Promise<void>;
  syncProgress: (userId: string) => Promise<void>;
  resetProgress: (userId: string) => Promise<void>;
  
  // Local state management
  setCurrentDay: (day: number) => void;
  updateLocalProgress: (taskId: string, progress: Partial<TaskProgress>) => void;
  clearLocalProgress: () => void;
  
  // Analytics
  getStats: (userId: string) => Promise<void>;
  
  // Utility
  reset: () => void;
  resetPlan: () => void;
  
  // Offline Queue Management
  addToOfflineQueue: (operation: Omit<OfflineOperation, 'id' | 'timestamp'>) => void;
  clearOfflineQueue: () => void;
  getOfflineQueueSize: () => number;
  getOfflineQueue: () => OfflineOperation[];
  processOfflineQueue: (userId: string) => Promise<void>;
  getSyncStatus: () => { pendingOperations: number; lastSync?: Date };
  initializePlan: (startDate: Date) => void;
  syncToDatabase: (userId: string) => Promise<boolean>;
}

const initialState = {
  tasks: [],
  localProgress: {},
  startDate: null,
  currentDay: 1,
  isLoading: false,
  isSyncing: false,
  error: null,
  lastSyncTime: null,
  offlineQueue: [],
};

export const useBouncePlanStore = create<BouncePlanStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

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

        loadProgress: async (userId) => {
          set({ isLoading: true, error: null });
          try {
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
              isLoading: false,
            });
          } catch (error) {
            console.error('Error loading bounce plan progress:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load progress',
              isLoading: false 
            });
          }
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
          set({ isLoading: true, error: null });
          try {
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
              isLoading: false,
            });
          } catch (error) {
            console.error('Error resetting progress:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to reset progress',
              isLoading: false 
            });
            throw error;
          }
        },

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

        getStats: async (userId) => {
          try {
            const stats = await getBouncePlanStats(userId);
            // Stats can be used for analytics or displayed in UI
            console.log('Bounce plan stats:', stats);
          } catch (error) {
            console.error('Error getting stats:', error);
          }
        },

        reset: () => {
          set(initialState);
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
        
        // Offline Queue Management
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
      }),
      {
        name: 'bounce-plan-store',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          localProgress: state.localProgress,
          currentDay: state.currentDay,
          lastSyncTime: state.lastSyncTime,
          offlineQueue: state.offlineQueue,
        }),
      }
    ),
    {
      name: 'BouncePlanStore',
    }
  )
);