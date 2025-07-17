import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  isOnline: boolean;
  queue: OfflineAction[];
  
  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromQueue: (actionId: string) => void;
  processQueue: () => Promise<{ success: boolean; syncedCount: number; failedCount: number }>;
  clearQueue: () => void;
  getQueueSize: () => number;
  retryFailedActions: () => Promise<{ success: boolean }>;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      queue: [],

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
        
        // Auto-sync when coming back online
        if (isOnline && get().queue.length > 0) {
          get().processQueue();
        }
      },

      addToQueue: (action) => {
        const newAction: OfflineAction = {
          ...action,
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          retryCount: 0,
        };

        set((state) => ({
          queue: [...state.queue, newAction],
        }));
      },

      removeFromQueue: (actionId: string) => {
        set((state) => ({
          queue: state.queue.filter(action => action.id !== actionId),
        }));
      },

      processQueue: async () => {
        const { queue, isOnline } = get();
        
        if (!isOnline || queue.length === 0) {
          return { success: true, syncedCount: 0, failedCount: 0 };
        }

        let syncedCount = 0;
        let failedCount = 0;
        const remainingQueue: OfflineAction[] = [];

        for (const action of queue) {
          try {
            // Simulate processing the action
            await processOfflineAction(action);
            syncedCount++;
          } catch (error) {
            console.warn('Failed to process offline action:', error);
            failedCount++;
            
            // Increment retry count and keep in queue if under retry limit
            if (action.retryCount < 3) {
              remainingQueue.push({
                ...action,
                retryCount: action.retryCount + 1,
              });
            }
          }
        }

        set({ queue: remainingQueue });

        return {
          success: failedCount === 0,
          syncedCount,
          failedCount,
        };
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      getQueueSize: () => {
        return get().queue.length;
      },

      retryFailedActions: async () => {
        const { queue } = get();
        const failedActions = queue.filter(action => action.retryCount > 0);
        
        if (failedActions.length === 0) {
          return { success: true };
        }

        // Reset retry count for failed actions
        const resetQueue = queue.map(action => 
          action.retryCount > 0 ? { ...action, retryCount: 0 } : action
        );
        
        set({ queue: resetQueue });
        
        // Process the queue again
        return get().processQueue();
      },
    }),
    {
      name: '@next_chapter/offline_store',
      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        queue: state.queue,
      }),
    }
  )
);

// Helper function to process different types of offline actions
async function processOfflineAction(action: OfflineAction): Promise<void> {
  switch (action.type) {
    case 'COMPLETE_TASK':
      // Process task completion
      console.log('Processing offline task completion:', action.payload);
      break;
      
    case 'UPDATE_BUDGET':
      // Process budget update
      console.log('Processing offline budget update:', action.payload);
      break;
      
    case 'ADD_JOB_APPLICATION':
      // Process job application
      console.log('Processing offline job application:', action.payload);
      break;
      
    default:
      console.warn('Unknown offline action type:', action.type);
  }
  
  // Simulate network request
  await new Promise(resolve => setTimeout(resolve, 100));
}