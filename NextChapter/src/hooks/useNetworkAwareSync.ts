import { useCallback } from 'react';
import { useOffline } from '../context/OfflineContext';
import { useBouncePlanStore } from '../stores/bouncePlanStore';

interface SyncOptions {
  showOfflineMessage?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for network-aware synchronization
 * Automatically handles offline queueing and sync attempts
 */
export function useNetworkAwareSync() {
  const { isConnected } = useOffline();
  const { addToOfflineQueue } = useBouncePlanStore();
  
  const syncWithFallback = useCallback(
    async (
      operation: () => Promise<boolean>,
      queueData: Parameters<typeof addToOfflineQueue>[0],
      options?: SyncOptions
    ) => {
      try {
        if (isConnected) {
          const success = await operation();
          if (success) {
            options?.onSuccess?.();
            return true;
          } else {
            // Failed while online, queue for retry
            addToOfflineQueue(queueData);
            return false;
          }
        } else {
          // Offline, queue immediately
          addToOfflineQueue(queueData);
          if (options?.showOfflineMessage) {
            console.log('Changes saved locally. Will sync when online.');
          }
          return true; // Return true since we successfully queued
        }
      } catch (error) {
        console.error('Sync error:', error);
        // Queue on error
        addToOfflineQueue(queueData);
        options?.onError?.(error as Error);
        return false;
      }
    },
    [isConnected, addToOfflineQueue]
  );
  
  return {
    isConnected,
    syncWithFallback,
  };
}