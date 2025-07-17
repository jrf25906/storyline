import { StoreApi, UseBoundStore } from 'zustand';
import type { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import type { CoachTone, JobApplicationStatus } from '../types/database';

/**
 * Creates a properly typed mock for Zustand stores
 * This prevents TypeScript errors when casting stores to Jest mocks
 */
export function createMockStore<T extends object>(
  initialState: T
): jest.MockedFunction<UseBoundStore<StoreApi<T>>> & {
  setState: jest.Mock;
  getState: jest.Mock;
} {
  const setState = jest.fn((partial: Partial<T> | ((state: T) => Partial<T>)) => {
    if (typeof partial === 'function') {
      Object.assign(initialState, partial(initialState));
    } else {
      Object.assign(initialState, partial);
    }
  });

  const getState = jest.fn(() => initialState);

  const subscribe = jest.fn();
  const destroy = jest.fn();

  const store = jest.fn(() => initialState) as any;
  store.setState = setState;
  store.getState = getState;
  store.subscribe = subscribe;
  store.destroy = destroy;

  return store;
}

/**
 * Creates a properly typed NetInfo state for tests
 */
export function createMockNetInfoState(
  type: NetInfoStateType,
  isConnected: boolean = true,
  isInternetReachable: boolean = true
): NetInfoState {
  const baseState = {
    type,
    isConnected,
    isInternetReachable,
  };

  switch (type) {
    case 'wifi' as NetInfoStateType:
      return {
        ...baseState,
        type: 'wifi' as NetInfoStateType.wifi,
        isWifiEnabled: true,
        details: {
          isConnectionExpensive: false,
          ssid: 'TestNetwork',
          bssid: '00:00:00:00:00:00',
          strength: 100,
          ipAddress: '192.168.1.1',
          subnet: '255.255.255.0',
          frequency: 2400,
        },
      } as NetInfoState;

    case 'cellular' as NetInfoStateType:
      return {
        ...baseState,
        type: 'cellular' as NetInfoStateType.cellular,
        details: {
          isConnectionExpensive: true,
          cellularGeneration: '4g',
          carrier: 'TestCarrier',
        },
      } as NetInfoState;

    case 'none' as NetInfoStateType:
      return {
        ...baseState,
        type: 'none' as NetInfoStateType.none,
        isConnected: false,
        isInternetReachable: false,
        details: null,
      } as NetInfoState;

    case 'unknown' as NetInfoStateType:
      return {
        ...baseState,
        type: 'unknown' as NetInfoStateType.unknown,
        details: null,
      } as unknown as NetInfoState;
      
    default:
      return {
        ...baseState,
        type: 'unknown' as NetInfoStateType.unknown,
        details: null,
      } as unknown as NetInfoState;
  }
}

/**
 * Network state constants with proper types
 */
export const NETWORK_STATES = {
  wifi: createMockNetInfoState('wifi' as NetInfoStateType),
  cellular: createMockNetInfoState('cellular' as NetInfoStateType),
  none: createMockNetInfoState('none' as NetInfoStateType),
  offline: createMockNetInfoState('none' as NetInfoStateType, false, false),
  unknown: createMockNetInfoState('unknown' as NetInfoStateType),
} as const;

/**
 * Mock Coach Store
 */
export interface MockCoachStore {
  // State
  conversations: any[];
  localMessages: any[];
  currentTone: CoachTone;
  preferredTone: CoachTone | null;
  isLoading: boolean;
  isSending: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  messageCount: number;
  dailyMessageCount: number;
  lastMessageDate: string | null;

  // Computed values
  getAllMessages: jest.Mock;
  getConversationHistory: jest.Mock;
  canSendMessage: jest.Mock;
  getMessageCountToday: jest.Mock;

  // Actions
  loadConversations: jest.Mock;
  sendMessage: jest.Mock;
  detectTone: jest.Mock;
  setPreferredTone: jest.Mock;
  setCurrentTone: jest.Mock;
  
  // Sync actions
  syncOfflineMessages: jest.Mock;
  saveOfflineMessage: jest.Mock;
  
  // Utility actions
  clearConversations: jest.Mock;
  clearConversation: jest.Mock;
  cloudSyncEnabled?: boolean;
  deleteConversation: jest.Mock;
  reset: jest.Mock;
}

export const createMockCoachStore = (overrides: Partial<MockCoachStore> = {}): MockCoachStore => ({
  // State
  conversations: [],
  localMessages: [],
  currentTone: 'pragmatist',
  preferredTone: null,
  isLoading: false,
  isSending: false,
  isSyncing: false,
  error: null,
  lastSyncTime: null,
  messageCount: 0,
  dailyMessageCount: 0,
  lastMessageDate: null,

  // Computed values
  getAllMessages: jest.fn(() => []),
  getConversationHistory: jest.fn(() => []),
  canSendMessage: jest.fn(() => true),
  getMessageCountToday: jest.fn(() => 0),

  // Actions
  loadConversations: jest.fn().mockResolvedValue(undefined),
  sendMessage: jest.fn().mockResolvedValue(null),
  detectTone: jest.fn(() => 'pragmatist'),
  setPreferredTone: jest.fn(),
  setCurrentTone: jest.fn(),
  
  // Sync actions
  syncOfflineMessages: jest.fn().mockResolvedValue(undefined),
  saveOfflineMessage: jest.fn(),
  
  // Utility actions
  clearConversations: jest.fn(),
  clearConversation: jest.fn(),
  cloudSyncEnabled: false,
  deleteConversation: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  
  ...overrides,
});

/**
 * Mock Bounce Plan Store
 */
export interface MockBouncePlanStore {
  // State
  tasks: any[];
  localProgress: Record<string, any>;
  startDate: Date | null;
  currentDay: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncTime: Date | null;

  // Computed values
  getTaskStatus: jest.Mock;
  getCompletedTasksCount: jest.Mock;
  getSkippedTasksCount: jest.Mock;
  getCompletionRate: jest.Mock;
  getDaysActive: jest.Mock;
  canAccessTask: jest.Mock;

  // Actions
  loadProgress: jest.Mock;
  completeTask: jest.Mock;
  skipTask: jest.Mock;
  undoTaskAction: jest.Mock;
  syncProgress: jest.Mock;
  resetProgress: jest.Mock;
  resetPlan: jest.Mock; // Alias for resetProgress
  
  // Local state management
  setCurrentDay: jest.Mock;
  updateLocalProgress: jest.Mock;
  clearLocalProgress: jest.Mock;
  
  // Analytics
  getStats: jest.Mock;
  
  // Utility
  reset: jest.Mock;
}

export const createMockBouncePlanStore = (overrides: Partial<MockBouncePlanStore> = {}): MockBouncePlanStore => {
  const store: MockBouncePlanStore = {
    // State
    tasks: [],
    localProgress: {},
    startDate: null,
    currentDay: 1,
    isLoading: false,
    isSyncing: false,
    error: null,
    lastSyncTime: null,

    // Computed values
    getTaskStatus: jest.fn(),
    getCompletedTasksCount: jest.fn(() => 0),
    getSkippedTasksCount: jest.fn(() => 0),
    getCompletionRate: jest.fn(() => 0),
    getDaysActive: jest.fn(() => 0),
    canAccessTask: jest.fn(() => true),

    // Actions
    loadProgress: jest.fn().mockResolvedValue(undefined),
    completeTask: jest.fn().mockResolvedValue(undefined),
    skipTask: jest.fn().mockResolvedValue(undefined),
    undoTaskAction: jest.fn().mockResolvedValue(undefined),
    syncProgress: jest.fn().mockResolvedValue(undefined),
    resetProgress: jest.fn().mockResolvedValue(undefined),
    resetPlan: jest.fn().mockResolvedValue(undefined), // Alias
    
    // Local state management
    setCurrentDay: jest.fn(),
    updateLocalProgress: jest.fn(),
    clearLocalProgress: jest.fn(),
    
    // Analytics
    getStats: jest.fn().mockResolvedValue(undefined),
    
    // Utility
    reset: jest.fn(),
    
    ...overrides,
  };
  
  // Make resetPlan call resetProgress
  store.resetPlan = store.resetProgress;
  
  return store;
};

/**
 * Mock Budget Store
 */
export interface MockBudgetStore {
  // State
  budgetData: any | null;
  budgetEntries: any[];
  runway: any | null;
  unemploymentBenefit: any | null;
  cobraEstimate: any | null;
  alerts: any[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Computed values
  getTotalMonthlyIncome: jest.Mock;
  getTotalMonthlyExpenses: jest.Mock;
  getMonthlyBurn: jest.Mock;
  getDaysUntilCritical: jest.Mock;
  hasLowRunway: jest.Mock;

  // Budget data actions
  loadBudget: jest.Mock;
  saveBudget: jest.Mock;
  updateBudget: jest.Mock;
  deleteBudget: jest.Mock;

  // Budget entries actions
  loadBudgetEntries: jest.Mock;
  addBudgetEntry: jest.Mock;
  updateBudgetEntry: jest.Mock;
  deleteBudgetEntry: jest.Mock;
  toggleBudgetEntry: jest.Mock;

  // Calculations
  calculateRunway: jest.Mock;
  calculateUnemploymentBenefit: jest.Mock;
  calculateCobraEstimate: jest.Mock;

  // Alerts
  checkAlerts: jest.Mock;
  dismissAlert: jest.Mock;
  clearAlerts: jest.Mock;

  // Utility
  reset: jest.Mock;
}

export const createMockBudgetStore = (overrides: Partial<MockBudgetStore> = {}): MockBudgetStore => ({
  // State
  budgetData: null,
  budgetEntries: [],
  runway: null,
  unemploymentBenefit: null,
  cobraEstimate: null,
  alerts: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // Computed values
  getTotalMonthlyIncome: jest.fn(() => 0),
  getTotalMonthlyExpenses: jest.fn(() => 0),
  getMonthlyBurn: jest.fn(() => 0),
  getDaysUntilCritical: jest.fn(() => 0),
  hasLowRunway: jest.fn(() => false),

  // Budget data actions
  loadBudget: jest.fn().mockResolvedValue(undefined),
  saveBudget: jest.fn().mockResolvedValue(undefined),
  updateBudget: jest.fn().mockResolvedValue(undefined),
  deleteBudget: jest.fn().mockResolvedValue(undefined),

  // Budget entries actions
  loadBudgetEntries: jest.fn().mockResolvedValue(undefined),
  addBudgetEntry: jest.fn().mockResolvedValue(undefined),
  updateBudgetEntry: jest.fn().mockResolvedValue(undefined),
  deleteBudgetEntry: jest.fn().mockResolvedValue(undefined),
  toggleBudgetEntry: jest.fn().mockResolvedValue(undefined),

  // Calculations
  calculateRunway: jest.fn(),
  calculateUnemploymentBenefit: jest.fn(),
  calculateCobraEstimate: jest.fn(),

  // Alerts
  checkAlerts: jest.fn(),
  dismissAlert: jest.fn(),
  clearAlerts: jest.fn(),

  // Utility
  reset: jest.fn(),
  
  ...overrides,
});

/**
 * Mock Job Tracker Store
 */
export interface MockJobTrackerStore {
  applications: any[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedStatus: JobApplicationStatus | 'all';
  offlineQueue: any[];
  lastSync?: Date;
  
  // Actions
  loadApplications: jest.Mock;
  addApplication: jest.Mock;
  updateApplication: jest.Mock;
  deleteApplication: jest.Mock;
  updateApplicationStatus: jest.Mock;
  setSearchQuery: jest.Mock;
  setSelectedStatus: jest.Mock;
  syncWithSupabase: jest.Mock;
  
  // Sync-related actions
  hasPendingSyncs: jest.Mock;
  getSyncStatus: jest.Mock;
  getPendingSyncApplications: jest.Mock;
  getOfflineApplications: jest.Mock;
  uploadOfflineApplications: jest.Mock;
  resolveConflicts: jest.Mock;
  syncApplications: jest.Mock;
  updateLocalApplications: jest.Mock;
  getOfflineQueue: jest.Mock;
}

export const createMockJobTrackerStore = (overrides: Partial<MockJobTrackerStore> = {}): MockJobTrackerStore => ({
  applications: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedStatus: 'all',
  offlineQueue: [],
  lastSync: undefined,
  
  // Actions
  loadApplications: jest.fn().mockResolvedValue(undefined),
  addApplication: jest.fn().mockResolvedValue(undefined),
  updateApplication: jest.fn().mockResolvedValue(undefined),
  deleteApplication: jest.fn().mockResolvedValue(undefined),
  updateApplicationStatus: jest.fn().mockResolvedValue(undefined),
  setSearchQuery: jest.fn(),
  setSelectedStatus: jest.fn(),
  syncWithSupabase: jest.fn().mockResolvedValue(undefined),
  
  // Sync-related actions
  hasPendingSyncs: jest.fn(() => false),
  getSyncStatus: jest.fn(() => ({ pendingOperations: 0, lastSync: undefined })),
  getPendingSyncApplications: jest.fn(() => []),
  getOfflineApplications: jest.fn(() => []),
  uploadOfflineApplications: jest.fn().mockResolvedValue({ success: true, uploaded: 0, failed: 0 }),
  resolveConflicts: jest.fn().mockResolvedValue({ toUpload: [], toUpdate: [] }),
  syncApplications: jest.fn().mockResolvedValue(true),
  updateLocalApplications: jest.fn().mockResolvedValue(true),
  getOfflineQueue: jest.fn(() => []),
  
  ...overrides,
});

/**
 * Mock Wellness Store
 */
export interface MockWellnessStore {
  moods: any[];
  weeklyStats: any | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadMoods: jest.Mock;
  addMood: jest.Mock;
  getWeeklyStats: jest.Mock;
  getTrend: jest.Mock;
  reset: jest.Mock;
}

export const createMockWellnessStore = (overrides: Partial<MockWellnessStore> = {}): MockWellnessStore => ({
  moods: [],
  weeklyStats: null,
  isLoading: false,
  error: null,
  
  // Actions
  loadMoods: jest.fn().mockResolvedValue(undefined),
  addMood: jest.fn().mockResolvedValue(undefined),
  getWeeklyStats: jest.fn().mockResolvedValue(undefined),
  getTrend: jest.fn(() => 'stable'),
  reset: jest.fn(),
  
  ...overrides,
});

/**
 * Mock Onboarding Store
 */
export interface MockOnboardingStore {
  currentStep: number;
  totalSteps: number;
  data: any;
  completed: boolean;
  
  // Actions
  nextStep: jest.Mock;
  previousStep: jest.Mock;
  updateData: jest.Mock;
  completeOnboarding: jest.Mock;
  reset: jest.Mock;
}

export const createMockOnboardingStore = (overrides: Partial<MockOnboardingStore> = {}): MockOnboardingStore => ({
  currentStep: 0,
  totalSteps: 5,
  data: {},
  completed: false,
  
  // Actions
  nextStep: jest.fn(),
  previousStep: jest.fn(),
  updateData: jest.fn(),
  completeOnboarding: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  
  ...overrides,
});

/**
 * Mock Auth Store
 */
export interface MockAuthStore {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  signIn: jest.Mock;
  signUp: jest.Mock;
  signOut: jest.Mock;
  resetPassword: jest.Mock;
  updateProfile: jest.Mock;
  checkSession: jest.Mock;
  reset: jest.Mock;
}

export const createMockAuthStore = (overrides: Partial<MockAuthStore> = {}): MockAuthStore => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  
  // Actions
  signIn: jest.fn().mockResolvedValue(undefined),
  signUp: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn().mockResolvedValue(undefined),
  resetPassword: jest.fn().mockResolvedValue(undefined),
  updateProfile: jest.fn().mockResolvedValue(undefined),
  checkSession: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  
  ...overrides,
});

/**
 * Helper to create a mock Zustand hook with selector support
 */
export function createMockZustandHook<T>(mockStore: T) {
  return jest.fn((selector?: (state: T) => any) => {
    if (selector) {
      return selector(mockStore);
    }
    return mockStore;
  });
}