import { BaseStore } from '@stores/interfaces/base';

export type ErrorType = 'error' | 'warning' | 'info';
export type NetworkStatus = 'online' | 'offline' | 'slow';

/**
 * Global error object
 */
export interface GlobalError {
  error: Error;
  message: string;
  type: ErrorType;
  recoveryAction?: () => void;
}

/**
 * Offline action for queue
 */
export interface OfflineAction {
  type: string;
  payload: any;
  timestamp?: number;
}

/**
 * Global UI operations interface
 * Handles global loading and error states
 */
export interface GlobalUIOperations {
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setGlobalError: (
    error: Error, 
    message?: string, 
    type?: ErrorType,
    recoveryAction?: () => void
  ) => void;
  clearGlobalError: () => void;
}

/**
 * Feature-specific UI operations interface
 * Handles loading and error states per feature
 */
export interface FeatureUIOperations {
  setFeatureLoading: (feature: string, loading: boolean) => void;
  setFeatureError: (feature: string, error: string) => void;
  clearFeatureError: (feature: string) => void;
  isFeatureLoading: (feature: string) => boolean;
  getFeatureError: (feature: string) => string | undefined;
}

/**
 * Network operations interface
 */
export interface NetworkOperations {
  setNetworkStatus: (status: NetworkStatus) => void;
  isOffline: () => boolean;
}

/**
 * Offline queue operations interface
 */
export interface UIOfflineQueueOperations {
  addToOfflineQueue: (action: OfflineAction) => void;
  clearOfflineQueue: () => void;
}

/**
 * UI helper operations interface
 */
export interface UIHelperOperations {
  getEmpathyErrorMessage: (errorType: string) => string;
  isAnyFeatureLoading: () => boolean;
  isLoading: () => boolean;
}

/**
 * UI store state interface
 */
export interface UIStoreState {
  // Global states
  globalLoading: boolean;
  loadingMessage?: string;
  globalError: GlobalError | null;
  
  // Feature-specific states
  loadingStates: Record<string, boolean>;
  errors: Record<string, string>;
  
  // Network state
  networkStatus: NetworkStatus;
  
  // Offline queue
  offlineQueue: OfflineAction[];
}

/**
 * Complete UI store interface
 * Combines all UI state management functionality
 */
export interface UIStore extends 
  BaseStore,
  UIStoreState,
  GlobalUIOperations,
  FeatureUIOperations,
  NetworkOperations,
  UIOfflineQueueOperations,
  UIHelperOperations {}