// Mock implementation of the old bouncePlanStore interface for tests
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineOperation {
  id?: string;
  type: 'complete' | 'skip' | 'reopen';
  taskId: string;
  timestamp?: string;
  data?: any;
}

interface OldBouncePlanStore {
  // Old state structure
  startDate: Date | null;
  currentDay: number;
  completedTasks: Set<string>;
  skippedTasks: Set<string>;
  taskNotes: Record<string, string>;
  offlineQueue: OfflineOperation[];

  // Old methods
  initializePlan: (startDate: Date) => void;
  completeTask: (taskId: string, notes?: string) => Promise<void>;
  skipTask: (taskId: string) => Promise<void>;
  reopenTask: (taskId: string) => Promise<void>;
  resetPlan: () => void;
  
  // Computed
  isTaskCompleted: (taskId: string) => boolean;
  isTaskSkipped: (taskId: string) => boolean;
  getCurrentDay: () => number;
  isTaskUnlocked: (day: number) => boolean;
  getTaskStatus: (taskId: string) => 'completed' | 'skipped' | 'available' | 'locked';
  getUnlockedDays: () => number[];
  
  // Offline queue
  addToOfflineQueue: (operation: Omit<OfflineOperation, 'id' | 'timestamp'>) => void;
  clearOfflineQueue: () => void;
  getOfflineQueueSize: () => number;
}

const initialState = {
  startDate: null,
  currentDay: 1,
  completedTasks: new Set<string>(),
  skippedTasks: new Set<string>(),
  taskNotes: {},
  offlineQueue: [],
};

export const useBouncePlanStoreMock = create<OldBouncePlanStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        initializePlan: (startDate) => {
          set({
            startDate,
            currentDay: 1,
            completedTasks: new Set(),
            skippedTasks: new Set(),
            taskNotes: {},
          });
        },

        completeTask: async (taskId, notes) => {
          const { skippedTasks, completedTasks, taskNotes } = get();
          const newSkipped = new Set(skippedTasks);
          newSkipped.delete(taskId);
          
          const newCompleted = new Set(completedTasks);
          newCompleted.add(taskId);
          
          const newNotes = { ...taskNotes };
          if (notes) {
            newNotes[taskId] = notes;
          }
          
          set({
            completedTasks: newCompleted,
            skippedTasks: newSkipped,
            taskNotes: newNotes,
          });
        },

        skipTask: async (taskId) => {
          const { completedTasks, skippedTasks } = get();
          const newCompleted = new Set(completedTasks);
          newCompleted.delete(taskId);
          
          const newSkipped = new Set(skippedTasks);
          newSkipped.add(taskId);
          
          set({
            completedTasks: newCompleted,
            skippedTasks: newSkipped,
          });
        },

        reopenTask: async (taskId) => {
          const { completedTasks, skippedTasks } = get();
          const newCompleted = new Set(completedTasks);
          newCompleted.delete(taskId);
          
          const newSkipped = new Set(skippedTasks);
          newSkipped.delete(taskId);
          
          set({
            completedTasks: newCompleted,
            skippedTasks: newSkipped,
          });
        },

        resetPlan: () => {
          set(initialState);
        },

        isTaskCompleted: (taskId) => {
          return get().completedTasks.has(taskId);
        },

        isTaskSkipped: (taskId) => {
          return get().skippedTasks.has(taskId);
        },

        getCurrentDay: () => {
          const { startDate } = get();
          if (!startDate) return 0;
          
          const now = new Date();
          const diffTime = now.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return Math.min(diffDays + 1, 30); // Day 1 is the start date
        },

        isTaskUnlocked: (day) => {
          const { startDate } = get();
          if (!startDate) return false;
          
          const now = new Date();
          const unlockDate = new Date(startDate);
          unlockDate.setDate(unlockDate.getDate() + day - 1);
          unlockDate.setHours(9, 0, 0, 0); // Unlock at 9 AM
          
          return now >= unlockDate;
        },

        getTaskStatus: (taskId) => {
          const { completedTasks, skippedTasks } = get();
          
          if (completedTasks.has(taskId)) return 'completed';
          if (skippedTasks.has(taskId)) return 'skipped';
          
          // Extract day number from taskId (e.g., 'day1_breathe' -> 1)
          const dayMatch = taskId.match(/day(\d+)_/);
          if (!dayMatch) return 'locked';
          
          const day = parseInt(dayMatch[1], 10);
          return get().isTaskUnlocked(day) ? 'available' : 'locked';
        },

        getUnlockedDays: () => {
          const days = [];
          for (let day = 1; day <= 30; day++) {
            if (get().isTaskUnlocked(day)) {
              days.push(day);
            }
          }
          return days;
        },

        addToOfflineQueue: (operation) => {
          const { offlineQueue } = get();
          const newOperation: OfflineOperation = {
            ...operation,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
          };
          set({ offlineQueue: [...offlineQueue, newOperation] });
        },

        clearOfflineQueue: () => {
          set({ offlineQueue: [] });
        },

        getOfflineQueueSize: () => {
          return get().offlineQueue.length;
        },
      }),
      {
        name: 'bounce-plan-store-mock',
      }
    )
  )
);