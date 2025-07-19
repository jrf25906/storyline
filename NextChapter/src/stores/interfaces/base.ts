/**
 * Base interface for all Zustand stores
 * Enforces common functionality like reset
 */
export interface BaseStore {
  /**
   * Reset the store to its initial state
   */
  reset: () => void;
}

/**
 * Base state interface that all stores should extend
 * Contains common state properties
 */
export interface BaseState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Async operation result type
 */
export type AsyncResult<T = void> = Promise<T>;

/**
 * Common store methods for data operations
 */
export interface DataOperations<T> {
  load: () => AsyncResult;
  save: (data: Partial<T>) => AsyncResult;
  update: (updates: Partial<T>) => AsyncResult;
  delete: () => AsyncResult;
}