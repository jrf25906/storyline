import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

interface UseLoadingStateOptions {
  errorMessage?: string;
  onError?: (error: Error) => void;
}

export function useLoadingState(
  feature: string,
  options?: UseLoadingStateOptions
) {
  const {
    setFeatureLoading,
    setFeatureError,
    clearFeatureError,
    isFeatureLoading,
    getFeatureError,
  } = useUIStore();

  const isLoading = isFeatureLoading(feature);
  const error = getFeatureError(feature);

  const execute = useCallback(
    async <T>(asyncFunction: () => Promise<T>): Promise<T> => {
      try {
        setFeatureLoading(feature, true);
        clearFeatureError(feature);
        
        const result = await asyncFunction();
        
        setFeatureLoading(feature, false);
        return result;
      } catch (error) {
        setFeatureLoading(feature, false);
        
        const errorMessage = options?.errorMessage || 
          (error instanceof Error ? error.message : 'An error occurred');
        
        setFeatureError(feature, errorMessage);
        
        if (options?.onError && error instanceof Error) {
          options.onError(error);
        }
        
        throw error;
      }
    },
    [feature, setFeatureLoading, setFeatureError, clearFeatureError, options]
  );

  const clearError = useCallback(() => {
    clearFeatureError(feature);
  }, [feature, clearFeatureError]);

  return {
    isLoading,
    error,
    execute,
    clearError,
  };
}