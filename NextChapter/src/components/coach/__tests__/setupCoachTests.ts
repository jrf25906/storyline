// Mock setup for coach component tests

// Create a mock implementation that can be overridden in tests
const mockCoachStore = {
  clearConversation: jest.fn(),
  cloudSyncEnabled: false,
  setCloudSyncEnabled: jest.fn(),
  getMessageCountToday: jest.fn(() => 0),
  conversation: {
    messages: [],
    lastMessageDate: new Date(),
    messagesUsedToday: 0,
  },
  isLoading: false,
  error: null,
  hasPendingSyncs: jest.fn(() => false),
  getSyncStatus: jest.fn(() => ({ pendingOperations: 0 })),
  getPendingSyncMessages: jest.fn(() => []),
  mergeConversations: jest.fn(),
  syncConversation: jest.fn(),
  getOfflineQueue: jest.fn(() => []),
  loadConversation: jest.fn(),
  addMessage: jest.fn(),
  canSendMessage: jest.fn(() => true),
  resetDailyLimit: jest.fn(),
};

// Mock the store module
jest.mock('../../../stores/coachStore', () => {
  const actualModule = jest.requireActual('../../../stores/coachStore');
  return {
    ...actualModule,
    useCoachStore: jest.fn(() => mockCoachStore),
  };
});

// Export the mock for test overrides
export { mockCoachStore };

jest.mock('../../../stores/bouncePlanStore', () => ({
  useBouncePlanStore: jest.fn(() => ({
    tasks: [],
    isLoading: false,
    error: null,
    loadTasks: jest.fn(),
    completeTask: jest.fn(),
    resetProgress: jest.fn(),
    getCurrentWeek: jest.fn(() => 1),
    getCompletionRate: jest.fn(() => 0),
    canAccessTask: jest.fn(() => true),
    hasCompletedOnboarding: jest.fn(() => true),
    getTaskById: jest.fn(),
    getTodaysTasks: jest.fn(() => []),
    hasPendingSyncs: jest.fn(() => false),
    getSyncQueue: jest.fn(() => []),
    getSyncStatus: jest.fn(() => ({ pendingOperations: 0 })),
  })),
}));

jest.mock('../../../stores/budgetStore', () => ({
  useBudgetStore: jest.fn(() => ({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savings: 0,
    severanceAmount: 0,
    unemploymentAmount: 0,
    runwayMonths: 0,
    isLoading: false,
    error: null,
    updateIncome: jest.fn(),
    updateExpenses: jest.fn(),
    updateSavings: jest.fn(),
    updateSeverance: jest.fn(),
    updateUnemployment: jest.fn(),
    calculateRunway: jest.fn(),
    loadBudget: jest.fn(),
    saveBudget: jest.fn(),
    hasPendingChanges: jest.fn(() => false),
  })),
}));

jest.mock('../../../stores/wellnessStore', () => ({
  useWellnessStore: jest.fn(() => ({
    currentMood: null,
    entries: [],
    streak: 0,
    isLoading: false,
    error: null,
    addEntry: jest.fn(),
    loadEntries: jest.fn(),
    getCurrentStreak: jest.fn(() => 0),
    getMoodTrend: jest.fn(() => 'stable'),
    getWeeklyAverage: jest.fn(() => null),
    hasPendingSyncs: jest.fn(() => false),
  })),
}));

jest.mock('../../../stores/jobTrackerStore', () => ({
  useJobTrackerStore: jest.fn(() => ({
    applications: [],
    isLoading: false,
    error: null,
    addApplication: jest.fn(),
    updateApplication: jest.fn(),
    moveApplication: jest.fn(),
    deleteApplication: jest.fn(),
    loadApplications: jest.fn(),
    getApplicationsByStage: jest.fn(() => []),
    getApplicationById: jest.fn(),
    getRecentApplications: jest.fn(() => []),
    hasPendingSyncs: jest.fn(() => false),
  })),
}));

// Mock Supabase
jest.mock('../../../services/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ 
        data: { subscription: { unsubscribe: jest.fn() } } 
      }),
    },
  },
}));

// Mock SyncManager
jest.mock('../../../services/database/sync/syncManager', () => ({
  syncManager: {
    hasPendingChanges: jest.fn(() => false),
    hasPendingSyncs: jest.fn(() => false),
    getSyncStatus: jest.fn(() => ({ pendingOperations: 0 })),
    syncAll: jest.fn(),
    setupPeriodicSync: jest.fn(),
    checkPendingSync: jest.fn(),
  },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
}));

// Helper to update mock store values
export const updateMockCoachStore = (updates: Partial<typeof mockCoachStore>) => {
  Object.assign(mockCoachStore, updates);
};

// Helper to reset mock store to defaults
export const resetMockCoachStore = () => {
  mockCoachStore.clearConversation.mockClear();
  mockCoachStore.cloudSyncEnabled = false;
  mockCoachStore.setCloudSyncEnabled.mockClear();
  mockCoachStore.getMessageCountToday.mockClear();
  mockCoachStore.getMessageCountToday.mockReturnValue(0);
  mockCoachStore.conversation = {
    messages: [],
    lastMessageDate: new Date(),
    messagesUsedToday: 0,
  };
  mockCoachStore.isLoading = false;
  mockCoachStore.error = null;
  mockCoachStore.hasPendingSyncs.mockClear();
  mockCoachStore.hasPendingSyncs.mockReturnValue(false);
  mockCoachStore.getSyncStatus.mockClear();
  mockCoachStore.getSyncStatus.mockReturnValue({ pendingOperations: 0 });
  mockCoachStore.getPendingSyncMessages.mockClear();
  mockCoachStore.getPendingSyncMessages.mockReturnValue([]);
  mockCoachStore.mergeConversations.mockClear();
  mockCoachStore.syncConversation.mockClear();
  mockCoachStore.getOfflineQueue.mockClear();
  mockCoachStore.getOfflineQueue.mockReturnValue([]);
  mockCoachStore.loadConversation.mockClear();
  mockCoachStore.addMessage.mockClear();
  mockCoachStore.canSendMessage.mockClear();
  mockCoachStore.canSendMessage.mockReturnValue(true);
  mockCoachStore.resetDailyLimit.mockClear();
};