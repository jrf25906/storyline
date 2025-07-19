import { create, StateCreator } from 'zustand';
import { devtools, persist, PersistOptions } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseStore } from '@stores/interfaces/base';

/**
 * Store factory configuration options
 */
export interface StoreFactoryOptions<T> {
  /**
   * Name of the store for devtools and persistence
   */
  name: string;
  
  /**
   * Enable persistence (default: false)
   */
  persist?: boolean;
  
  /**
   * Custom persistence options
   */
  persistOptions?: Partial<PersistOptions<T>>;
  
  /**
   * Enable Redux DevTools (default: true in development)
   */
  devtools?: boolean;
  
  /**
   * Partition function for persistence
   * Determines which parts of the state to persist
   */
  partialize?: (state: T) => Partial<T>;
}

/**
 * Default async storage configuration for React Native
 */
const defaultAsyncStorage = {
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
};

/**
 * Factory function to create Zustand stores with common configuration
 * Implements Single Responsibility Principle by separating store creation logic
 * 
 * @param storeCreator - The state creator function
 * @param options - Store configuration options
 * @returns Configured Zustand store hook
 */
export function createStore<T extends BaseStore>(
  storeCreator: StateCreator<T, [], [], T>,
  options: StoreFactoryOptions<T>
): ReturnType<typeof create<T>> {
  const {
    name,
    persist: enablePersist = false,
    persistOptions = {},
    devtools: enableDevtools = __DEV__,
    partialize,
  } = options;

  // Build the store creator with middleware
  let finalStoreCreator = storeCreator;

  // Apply persistence middleware if enabled
  if (enablePersist) {
    const persistConfig: PersistOptions<T> = {
      name: `@next_chapter/${name}`,
      storage: defaultAsyncStorage,
      ...persistOptions,
    };

    // Add partialize function if provided
    if (partialize) {
      persistConfig.partialize = partialize;
    }

    finalStoreCreator = persist(finalStoreCreator, persistConfig) as StateCreator<T, [], [], T>;
  }

  // Apply devtools middleware if enabled
  if (enableDevtools) {
    finalStoreCreator = devtools(finalStoreCreator, { name }) as StateCreator<T, [], [], T>;
  }

  // Create and return the store
  return create<T>()(finalStoreCreator);
}

/**
 * Helper function to create initial state with common properties
 * Promotes DRY principle by standardizing initial state creation
 */
export function createInitialState<T extends Record<string, any>>(
  customState: T
): T & { isLoading: boolean; error: string | null } {
  return {
    isLoading: false,
    error: null,
    ...customState,
  };
}

/**
 * Helper function to handle async operations with loading and error states
 * Encapsulates common async operation patterns
 */
export async function handleAsyncOperation<T>(
  set: (partial: any) => void,
  operation: () => Promise<T>,
  options?: {
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    loadingKey?: string;
    errorKey?: string;
  }
): Promise<T | null> {
  const {
    onSuccess,
    onError,
    loadingKey = 'isLoading',
    errorKey = 'error',
  } = options || {};

  // Set loading state
  set({ [loadingKey]: true, [errorKey]: null });

  try {
    const result = await operation();
    
    // Clear loading state
    set({ [loadingKey]: false });
    
    // Call success callback if provided
    if (onSuccess) {
      onSuccess(result);
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    
    // Set error state
    set({ 
      [loadingKey]: false, 
      [errorKey]: errorMessage 
    });
    
    // Call error callback if provided
    if (onError) {
      onError(error as Error);
    }
    
    // Log error in development
    if (__DEV__) {
      console.error('Store operation error:', error);
    }
    
    return null;
  }
}

/**
 * Type guard to check if a value is a store with reset method
 */
export function hasResetMethod<T>(store: T): store is T & BaseStore {
  return (
    typeof store === 'object' &&
    store !== null &&
    'reset' in store &&
    typeof (store as any).reset === 'function'
  );
}