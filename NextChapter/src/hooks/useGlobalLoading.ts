import { useCallback } from 'react';
import { useUIStore } from '@stores/uiStore';

export function useGlobalLoading() {
  const { globalLoading, setGlobalLoading, setGlobalError } = useUIStore();

  const executeWithGlobalLoading = useCallback(
    async <T>(
      asyncFunction: () => Promise<T>,
      loadingMessage?: string,
      errorMessage?: string
    ): Promise<T> => {
      try {
        setGlobalLoading(true, loadingMessage);
        const result = await asyncFunction();
        setGlobalLoading(false);
        return result;
      } catch (error) {
        setGlobalLoading(false);
        
        const message = errorMessage || 
          (error instanceof Error ? error.message : 'Something unexpected happened');
        
        setGlobalError(
          error instanceof Error ? error : new Error(String(error)),
          message
        );
        
        throw error;
      }
    },
    [setGlobalLoading, setGlobalError]
  );

  return {
    isLoading: globalLoading,
    executeWithGlobalLoading,
    setGlobalLoading,
  };
}