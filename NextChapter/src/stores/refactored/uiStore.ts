import { StateCreator } from 'zustand';
import { 
  UIStore, 
  UIStoreState, 
  ErrorType, 
  NetworkStatus,
  GlobalError,
  OfflineAction 
} from '@stores/interfaces/uiStore';
import { createStore, createInitialState } from '@stores/factory/createStore';

/**
 * Empathetic error messages based on error type
 * Following Single Responsibility - just data constants
 */
const EMPATHY_ERROR_MESSAGES: Record<string, string> = {
  network: "We're having trouble connecting. Your data is safe, and we'll sync when you're back online.",
  auth: "We need to verify it's you. Please sign in again when you're ready.",
  validation: "Let's double-check that information together.",
  server: 'Our servers are taking a moment. Thanks for your patience.',
  permission: "We need your permission to continue. You're in control.",
  notFound: "We couldn't find what you're looking for. Let's try a different approach.",
  timeout: "This is taking longer than expected. Let's give it another try.",
  unknown: "Something unexpected happened. We're here to help - please try again or reach out to support.",
};

/**
 * Default calming loading messages
 */
const DEFAULT_LOADING_MESSAGES = [
  'Taking care of that for you...',
  'Just a moment...',
  'Getting things ready...',
  'Almost there...',
  'Working on it...',
];

/**
 * Initial state for UI store
 */
const initialState = createInitialState<Omit<UIStoreState, 'isLoading' | 'error'>>({
  globalLoading: false,
  loadingMessage: undefined,
  globalError: null,
  loadingStates: {},
  errors: {},
  networkStatus: 'online',
  offlineQueue: [],
});

/**
 * Global UI operations implementation
 * Handles global loading and error states
 */
const createGlobalUIOperations: StateCreator<UIStore, [], [], Pick<UIStore,
  'setGlobalLoading' | 'setGlobalError' | 'clearGlobalError'
>> = (set, get) => ({
  setGlobalLoading: (loading, message) => set({
    globalLoading: loading,
    loadingMessage: loading 
      ? (message || DEFAULT_LOADING_MESSAGES[0])
      : undefined,
  }),
  
  setGlobalError: (error, message, type = 'error', recoveryAction) => set({
    globalError: {
      error,
      message: message || get().getEmpathyErrorMessage(error.name.toLowerCase()),
      type,
      recoveryAction,
    },
  }),
  
  clearGlobalError: () => set({ globalError: null }),
});

/**
 * Feature-specific UI operations implementation
 * Handles loading and error states per feature
 */
const createFeatureUIOperations: StateCreator<UIStore, [], [], Pick<UIStore,
  'setFeatureLoading' | 'setFeatureError' | 'clearFeatureError' | 'isFeatureLoading' | 'getFeatureError'
>> = (set, get) => ({
  setFeatureLoading: (feature, loading) => set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [feature]: loading,
    },
  })),
  
  isFeatureLoading: (feature) => get().loadingStates[feature] || false,
  
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
});

/**
 * Network operations implementation
 */
const createNetworkOperations: StateCreator<UIStore, [], [], Pick<UIStore,
  'setNetworkStatus' | 'isOffline'
>> = (set, get) => ({
  setNetworkStatus: (status) => set({ networkStatus: status }),
  
  isOffline: () => get().networkStatus === 'offline',
});

/**
 * Offline queue operations implementation
 */
const createOfflineQueueOperations: StateCreator<UIStore, [], [], Pick<UIStore,
  'addToOfflineQueue' | 'clearOfflineQueue'
>> = (set) => ({
  addToOfflineQueue: (action) => set((state) => ({
    offlineQueue: [...state.offlineQueue, { ...action, timestamp: Date.now() }],
  })),
  
  clearOfflineQueue: () => set({ offlineQueue: [] }),
});

/**
 * UI helper operations implementation
 */
const createUIHelperOperations: StateCreator<UIStore, [], [], Pick<UIStore,
  'getEmpathyErrorMessage' | 'isAnyFeatureLoading' | 'isLoading'
>> = (set, get) => ({
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
});

/**
 * Complete UI store creator
 * Combines all UI functionality using composition
 */
const uiStoreCreator: StateCreator<UIStore, [], [], UIStore> = (set, get) => ({
  ...initialState,
  ...createGlobalUIOperations(set, get, {} as any),
  ...createFeatureUIOperations(set, get, {} as any),
  ...createNetworkOperations(set, get, {} as any),
  ...createOfflineQueueOperations(set, get, {} as any),
  ...createUIHelperOperations(set, get, {} as any),
  
  // Reset function
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the UI store
 * Using factory pattern for consistent configuration
 */
export const useUIStore = createStore<UIStore>(
  uiStoreCreator,
  {
    name: 'ui-store',
    persist: false, // UI state shouldn't persist
    devtools: true,
  }
);