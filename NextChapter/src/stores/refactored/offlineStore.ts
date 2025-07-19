import { StateCreator } from 'zustand';
import { createStore, createInitialState, handleAsyncOperation } from '@stores/factory/createStore';
import { 
  IOfflineStore, 
  OfflineState, 
  OfflineAction, 
  SyncResult,
  OfflineActionType,
  IActionProcessor 
} from '@stores/interfaces/offlineStore';

/**
 * Maximum retry attempts for failed actions
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Initial state for offline store
 */
const initialState = createInitialState<Omit<OfflineState, 'isLoading' | 'error'>>({
  isOnline: true,
  queue: [],
});

/**
 * Default action processor implementation
 * In production, this would be replaced with actual API calls
 */
class DefaultActionProcessor implements IActionProcessor {
  async process(action: OfflineAction): Promise<void> {
    console.log(`Processing offline action: ${action.type}`, action.payload);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1 && action.retryCount < 2) {
      throw new Error('Simulated network error');
    }
  }
}

/**
 * Create the action processor instance
 * This can be injected for testing or different environments
 */
let actionProcessor: IActionProcessor = new DefaultActionProcessor();

/**
 * Set a custom action processor (useful for testing)
 */
export const setActionProcessor = (processor: IActionProcessor) => {
  actionProcessor = processor;
};

/**
 * Offline store implementation
 * Follows Single Responsibility Principle by managing offline functionality
 * Uses Dependency Inversion Principle with IActionProcessor
 */
const offlineStoreCreator: StateCreator<IOfflineStore, [], [], IOfflineStore> = (set, get) => ({
  ...initialState,

  // Network Status Operations
  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
    
    // Auto-sync when coming back online
    if (isOnline && get().queue.length > 0) {
      get().processQueue();
    }
  },

  // Queue Operations
  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
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

  clearQueue: () => {
    set({ queue: [] });
  },

  getQueueSize: () => {
    return get().queue.length;
  },

  // Sync Operations
  processQueue: async () => {
    const { queue, isOnline } = get();
    
    if (!isOnline || queue.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    return handleAsyncOperation(
      set,
      async () => {
        let syncedCount = 0;
        let failedCount = 0;
        const remainingQueue: OfflineAction[] = [];
        const errors: string[] = [];

        for (const action of queue) {
          try {
            await actionProcessor.process(action);
            syncedCount++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`Failed to process offline action ${action.id}:`, errorMessage);
            errors.push(`${action.type}: ${errorMessage}`);
            failedCount++;
            
            // Increment retry count and keep in queue if under retry limit
            if (action.retryCount < MAX_RETRY_ATTEMPTS) {
              remainingQueue.push({
                ...action,
                retryCount: action.retryCount + 1,
              });
            } else {
              console.error(`Action ${action.id} exceeded max retry attempts`);
              errors.push(`${action.type}: Exceeded max retry attempts`);
            }
          }
        }

        // Update queue with remaining actions
        set({ queue: remainingQueue });

        const result: SyncResult = {
          success: failedCount === 0,
          syncedCount,
          failedCount,
          errors: errors.length > 0 ? errors : undefined,
        };

        return result;
      },
      {
        loadingKey: 'isLoading',
        errorKey: 'error',
      }
    );
  },

  retryFailedActions: async () => {
    const { queue } = get();
    const failedActions = queue.filter(action => action.retryCount > 0);
    
    if (failedActions.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    // Reset retry count for failed actions
    const resetQueue = queue.map(action => 
      action.retryCount > 0 ? { ...action, retryCount: 0 } : action
    );
    
    set({ queue: resetQueue });
    
    // Process the queue again
    return get().processQueue();
  },

  // Base Store Operations
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the offline store
 * Uses factory pattern for consistent store creation
 */
export const useOfflineStore = createStore<IOfflineStore>(
  offlineStoreCreator,
  {
    name: 'offline-store',
    persist: true,
    partialize: (state) => ({
      queue: state.queue,
      // Don't persist isOnline status or loading states
    }),
  }
);

/**
 * Helper function to create typed offline actions
 * Promotes type safety and reduces errors
 */
export const createOfflineAction = <T extends OfflineActionType>(
  type: T,
  payload: any
): Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'> => ({
    type,
    payload,
  });

/**
 * Hook to check if there are pending offline actions
 */
export const usePendingOfflineActions = () => {
  const queue = useOfflineStore(state => state.queue);
  return queue.length > 0;
};

/**
 * Hook to get failed actions that need retry
 */
export const useFailedOfflineActions = () => {
  const queue = useOfflineStore(state => state.queue);
  return queue.filter(action => action.retryCount > 0);
};