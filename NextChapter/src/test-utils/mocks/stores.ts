/**
 * Mock Store Factories for Testing
 * 
 * Provides test doubles for all Zustand stores following the factory pattern.
 * These mocks are designed to be easily configurable for different test scenarios.
 */

import { StateCreator } from 'zustand';
import { buildTask, buildBudgetData, buildJobApplication } from '@test-utils/builders';

/**
 * Create a mock bounce plan store
 */
export const createMockBouncePlanStore = (overrides?: any) => {
  const store = {
    tasks: [buildTask()],
    currentDay: 1,
    completedTaskIds: ['task-1'],
    isLoading: false,
    error: null,
    loadTasks: jest.fn(),
    completeTask: jest.fn(),
    undoTaskCompletion: jest.fn(),
    getTodaysTasks: jest.fn().mockReturnValue([buildTask()]),
    getWeeklyProgress: jest.fn().mockReturnValue({
      completed: 5,
      total: 10,
      weekDays: [
        { date: new Date(), completed: true },
        { date: new Date(), completed: false },
      ],
    }),
    resetProgress: jest.fn(),
    syncWithRemote: jest.fn(),
    ...overrides,
  };

  // Add mock implementation for state changes
  store.completeTask.mockImplementation((taskId: string) => {
    if (!store.completedTaskIds.includes(taskId)) {
      store.completedTaskIds = [...store.completedTaskIds, taskId];
    }
  });

  store.undoTaskCompletion.mockImplementation((taskId: string) => {
    store.completedTaskIds = store.completedTaskIds.filter(id => id !== taskId);
  });

  return store;
};

/**
 * Create a mock budget store
 */
export const createMockBudgetStore = (overrides?: any) => {
  const store = {
    budgetData: buildBudgetData(),
    runway: 90,
    isLoading: false,
    error: null,
    loadBudgetData: jest.fn(),
    updateBudget: jest.fn(),
    calculateRunway: jest.fn().mockReturnValue(90),
    getBudgetAlerts: jest.fn().mockReturnValue([]),
    syncWithRemote: jest.fn(),
    ...overrides,
  };

  // Add mock implementation for budget updates
  store.updateBudget.mockImplementation((updates: any) => {
    store.budgetData = { ...store.budgetData, ...updates };
    store.runway = store.calculateRunway();
  });

  return store;
};

/**
 * Create a mock coach store
 */
export const createMockCoachStore = (overrides?: any) => {
  const store = {
    messages: [],
    currentTone: 'pragmatist' as const,
    isTyping: false,
    isLoading: false,
    error: null,
    sendMessage: jest.fn().mockResolvedValue({
      id: 'msg-1',
      content: 'Coach response',
      role: 'assistant',
      timestamp: new Date(),
    }),
    clearConversation: jest.fn(),
    setTone: jest.fn(),
    detectEmotionalState: jest.fn().mockReturnValue('neutral'),
    loadConversationHistory: jest.fn(),
    ...overrides,
  };

  // Add mock implementation for tone changes
  store.setTone.mockImplementation((tone: string) => {
    store.currentTone = tone;
  });

  return store;
};

/**
 * Create a mock job tracker store
 */
export const createMockJobTrackerStore = (overrides?: any) => {
  const store = {
    applications: [buildJobApplication()],
    isLoading: false,
    error: null,
    addApplication: jest.fn(),
    updateApplication: jest.fn(),
    deleteApplication: jest.fn(),
    moveApplication: jest.fn(),
    getApplicationsByStage: jest.fn().mockReturnValue({
      applied: [buildJobApplication()],
      interviewing: [],
      offer: [],
      rejected: [],
    }),
    getStats: jest.fn().mockReturnValue({
      total: 1,
      active: 1,
      interviews: 0,
      offers: 0,
    }),
    syncWithRemote: jest.fn(),
    ...overrides,
  };

  // Add mock implementation for application management
  store.addApplication.mockImplementation((app: any) => {
    store.applications = [...store.applications, { ...app, id: Date.now().toString() }];
  });

  return store;
};

/**
 * Create a mock UI store
 */
export const createMockUIStore = (overrides?: any) => {
  const store = {
    isLoading: false,
    loadingMessage: '',
    error: null,
    notification: null,
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    showError: jest.fn(),
    clearError: jest.fn(),
    showNotification: jest.fn(),
    clearNotification: jest.fn(),
    ...overrides,
  };

  // Add mock implementation for UI state changes
  store.showLoading.mockImplementation((message?: string) => {
    store.isLoading = true;
    store.loadingMessage = message || '';
  });

  store.hideLoading.mockImplementation(() => {
    store.isLoading = false;
    store.loadingMessage = '';
  });

  store.showError.mockImplementation((error: string) => {
    store.error = error;
  });

  return store;
};

/**
 * Create a mock wellness store
 */
export const createMockWellnessStore = (overrides?: any) => {
  const store = {
    moodEntries: [],
    currentMood: null,
    isLoading: false,
    error: null,
    logMood: jest.fn(),
    getMoodTrends: jest.fn().mockReturnValue({
      average: 3,
      trend: 'stable',
      lastWeek: [3, 4, 3, 2, 4, 3, 3],
    }),
    getCrisisResources: jest.fn().mockReturnValue([]),
    checkCrisisIndicators: jest.fn().mockReturnValue(false),
    syncWithRemote: jest.fn(),
    ...overrides,
  };

  // Add mock implementation for mood logging
  store.logMood.mockImplementation((mood: number, notes?: string) => {
    const entry = {
      id: Date.now().toString(),
      mood,
      notes,
      timestamp: new Date(),
    };
    store.moodEntries = [entry, ...store.moodEntries];
    store.currentMood = mood;
  });

  return store;
};

/**
 * Create a mock auth store
 */
export const createMockAuthStore = (overrides?: any) => {
  const store = {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    signIn: jest.fn().mockResolvedValue(true),
    signUp: jest.fn().mockResolvedValue(true),
    signOut: jest.fn().mockResolvedValue(true),
    refreshSession: jest.fn().mockResolvedValue(true),
    checkBiometricAvailability: jest.fn().mockResolvedValue(true),
    authenticateWithBiometric: jest.fn().mockResolvedValue(true),
    ...overrides,
  };

  // Add mock implementation for auth state changes
  store.signIn.mockImplementation(async () => {
    store.user = { id: 'test-user', email: 'test@example.com' };
    store.isAuthenticated = true;
    return true;
  });

  store.signOut.mockImplementation(async () => {
    store.user = null;
    store.isAuthenticated = false;
    return true;
  });

  return store;
};

/**
 * Helper to create a Zustand store mock with state updates
 */
export const createZustandMock = <T extends Record<string, any>>(
  initialState: T
): StateCreator<T> => {
  let state = { ...initialState };

  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    if (typeof partial === 'function') {
      state = { ...state, ...partial(state) };
    } else {
      state = { ...state, ...partial };
    }
  };

  const getState = () => state;

  const subscribe = (listener: (state: T) => void) => {
    // Simple subscription mock
    return () => {};
  };

  const destroy = () => {
    state = { ...initialState };
  };

  return (set, get, api) => ({
    ...initialState,
    setState,
    getState,
    subscribe,
    destroy,
  });
};

/**
 * Helper to reset all store mocks
 */
export const resetAllStoreMocks = (stores: Record<string, any>) => {
  Object.values(stores).forEach(store => {
    if (store && typeof store === 'object') {
      Object.keys(store).forEach(key => {
        if (typeof store[key] === 'function' && store[key].mockReset) {
          store[key].mockReset();
        }
      });
    }
  });
};