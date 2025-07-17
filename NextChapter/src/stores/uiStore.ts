import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ErrorType = 'error' | 'warning' | 'info';
export type NetworkStatus = 'online' | 'offline' | 'slow';

interface GlobalError {
  error: Error;
  message: string;
  type: ErrorType;
  recoveryAction?: () => void;
}

interface OfflineAction {
  type: string;
  payload: any;
  timestamp?: number;
}

interface UIState {
  // Global loading state
  globalLoading: boolean;
  loadingMessage?: string;
  
  // Global error state
  globalError: GlobalError | null;
  
  // Feature-specific loading states
  loadingStates: Record<string, boolean>;
  
  // Feature-specific errors
  errors: Record<string, string>;
  
  // Network status
  networkStatus: NetworkStatus;
  
  // Offline queue
  offlineQueue: OfflineAction[];
  
  // Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setGlobalError: (
    error: Error, 
    message?: string, 
    type?: ErrorType,
    recoveryAction?: () => void
  ) => void;
  clearGlobalError: () => void;
  
  // Feature-specific actions
  setFeatureLoading: (feature: string, loading: boolean) => void;
  setFeatureError: (feature: string, error: string) => void;
  clearFeatureError: (feature: string) => void;
  isFeatureLoading: (feature: string) => boolean;
  getFeatureError: (feature: string) => string | undefined;
  
  // Network actions
  setNetworkStatus: (status: NetworkStatus) => void;
  isOffline: () => boolean;
  
  // Offline queue actions
  addToOfflineQueue: (action: OfflineAction) => void;
  clearOfflineQueue: () => void;
  
  // Helper functions
  getEmpathyErrorMessage: (errorType: string) => string;
  isAnyFeatureLoading: () => boolean;
  isLoading: () => boolean;
}

// Empathetic error messages based on error type
const EMPATHY_ERROR_MESSAGES: Record<string, string> = {
  network: "We're having trouble connecting. Your data is safe, and we'll sync when you're back online.",
  auth: "We need to verify it's you. Please sign in again when you're ready.",
  validation: "Let's double-check that information together.",
  server: "Our servers are taking a moment. Thanks for your patience.",
  permission: "We need your permission to continue. You're in control.",
  notFound: "We couldn't find what you're looking for. Let's try a different approach.",
  timeout: "This is taking longer than expected. Let's give it another try.",
  unknown: "Something unexpected happened. We're here to help - please try again or reach out to support.",
};

// Default calming loading messages
const DEFAULT_LOADING_MESSAGES = [
  "Taking care of that for you...",
  "Just a moment...",
  "Getting things ready...",
  "Almost there...",
  "Working on it...",
];

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      globalLoading: false,
      loadingMessage: undefined,
      globalError: null,
      loadingStates: {},
      errors: {},
      networkStatus: 'online',
      offlineQueue: [],
      
      // Global loading actions
      setGlobalLoading: (loading, message) => set({
        globalLoading: loading,
        loadingMessage: loading 
          ? (message || DEFAULT_LOADING_MESSAGES[0])
          : undefined,
      }),
      
      // Global error actions
      setGlobalError: (error, message, type = 'error', recoveryAction) => set({
        globalError: {
          error,
          message: message || get().getEmpathyErrorMessage(error.name.toLowerCase()),
          type,
          recoveryAction,
        },
      }),
      
      clearGlobalError: () => set({ globalError: null }),
      
      // Feature-specific loading actions
      setFeatureLoading: (feature, loading) => set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [feature]: loading,
        },
      })),
      
      isFeatureLoading: (feature) => get().loadingStates[feature] || false,
      
      // Feature-specific error actions
      setFeatureError: (feature, error) => set((state) => ({
        errors: {
          ...state.errors,
          [feature]: error,
        },
      })),
      
      clearFeatureError: (feature) => set((state) => {
        const newErrors = { ...state.errors };
        delete newErrors[feature];
        return { errors: newErrors };
      }),
      
      getFeatureError: (feature) => get().errors[feature],
      
      // Network status actions
      setNetworkStatus: (status) => set({ networkStatus: status }),
      
      isOffline: () => get().networkStatus === 'offline',
      
      // Offline queue actions
      addToOfflineQueue: (action) => set((state) => ({
        offlineQueue: [...state.offlineQueue, { ...action, timestamp: Date.now() }],
      })),
      
      clearOfflineQueue: () => set({ offlineQueue: [] }),
      
      // Helper functions
      getEmpathyErrorMessage: (errorType) => {
        return EMPATHY_ERROR_MESSAGES[errorType] || EMPATHY_ERROR_MESSAGES.unknown;
      },
      
      isAnyFeatureLoading: () => {
        const loadingStates = get().loadingStates;
        return Object.values(loadingStates).some(loading => loading);
      },
      
      isLoading: () => {
        return get().globalLoading || get().isAnyFeatureLoading();
      },
    }),
    {
      name: 'ui-store',
    }
  )
);