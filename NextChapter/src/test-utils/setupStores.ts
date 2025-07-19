/**
 * Quick setup utilities for mocking stores in tests
 * Import this at the top of your test files for easy store mocking
 */

import {
  createMockCoachStore,
  createMockBouncePlanStore,
  createMockBudgetStore,
  createMockJobTrackerStore,
  createMockWellnessStore,
  createMockOnboardingStore,
  createMockAuthStore,
  createMockZustandHook,
  MockCoachStore,
  MockBouncePlanStore,
  MockBudgetStore,
  MockJobTrackerStore,
  MockWellnessStore,
  MockOnboardingStore,
  MockAuthStore,
} from '@test-utils/mockHelpers';

// Store instances that can be modified in tests
export let mockCoachStore: MockCoachStore;
export let mockBouncePlanStore: MockBouncePlanStore;
export let mockBudgetStore: MockBudgetStore;
export let mockJobTrackerStore: MockJobTrackerStore;
export let mockWellnessStore: MockWellnessStore;
export let mockOnboardingStore: MockOnboardingStore;
export let mockAuthStore: MockAuthStore;

/**
 * Sets up all store mocks with default values
 * Call this before your tests
 */
export function setupAllStoreMocks() {
  // Create fresh instances
  mockCoachStore = createMockCoachStore();
  mockBouncePlanStore = createMockBouncePlanStore();
  mockBudgetStore = createMockBudgetStore();
  mockJobTrackerStore = createMockJobTrackerStore();
  mockWellnessStore = createMockWellnessStore();
  mockOnboardingStore = createMockOnboardingStore();
  mockAuthStore = createMockAuthStore();

  // Mock all stores
  jest.mock('@/stores/coach', () => ({
    useCoachStore: createMockZustandHook(mockCoachStore),
  }));

  jest.mock('@/stores/bouncePlan', () => ({
    useBouncePlanStore: createMockZustandHook(mockBouncePlanStore),
  }));

  jest.mock('@/stores/budget', () => ({
    useBudgetStore: createMockZustandHook(mockBudgetStore),
  }));

  jest.mock('@/stores/jobTracker', () => ({
    useJobTrackerStore: createMockZustandHook(mockJobTrackerStore),
  }));

  jest.mock('@/stores/wellness', () => ({
    useWellnessStore: createMockZustandHook(mockWellnessStore),
  }));

  jest.mock('@/stores/onboarding', () => ({
    useOnboardingStore: createMockZustandHook(mockOnboardingStore),
  }));

  jest.mock('@/stores/auth', () => ({
    useAuthStore: createMockZustandHook(mockAuthStore),
  }));
}

/**
 * Setup individual store mocks
 */
export function setupCoachStoreMock(overrides?: Partial<MockCoachStore>) {
  mockCoachStore = createMockCoachStore(overrides);
  jest.mock('@/stores/coach', () => ({
    useCoachStore: createMockZustandHook(mockCoachStore),
  }));
  return mockCoachStore;
}

export function setupBouncePlanStoreMock(overrides?: Partial<MockBouncePlanStore>) {
  mockBouncePlanStore = createMockBouncePlanStore(overrides);
  jest.mock('@/stores/bouncePlan', () => ({
    useBouncePlanStore: createMockZustandHook(mockBouncePlanStore),
  }));
  return mockBouncePlanStore;
}

export function setupBudgetStoreMock(overrides?: Partial<MockBudgetStore>) {
  mockBudgetStore = createMockBudgetStore(overrides);
  jest.mock('@/stores/budget', () => ({
    useBudgetStore: createMockZustandHook(mockBudgetStore),
  }));
  return mockBudgetStore;
}

export function setupJobTrackerStoreMock(overrides?: Partial<MockJobTrackerStore>) {
  mockJobTrackerStore = createMockJobTrackerStore(overrides);
  jest.mock('@/stores/jobTracker', () => ({
    useJobTrackerStore: createMockZustandHook(mockJobTrackerStore),
  }));
  return mockJobTrackerStore;
}

export function setupWellnessStoreMock(overrides?: Partial<MockWellnessStore>) {
  mockWellnessStore = createMockWellnessStore(overrides);
  jest.mock('@/stores/wellness', () => ({
    useWellnessStore: createMockZustandHook(mockWellnessStore),
  }));
  return mockWellnessStore;
}

export function setupOnboardingStoreMock(overrides?: Partial<MockOnboardingStore>) {
  mockOnboardingStore = createMockOnboardingStore(overrides);
  jest.mock('@/stores/onboarding', () => ({
    useOnboardingStore: createMockZustandHook(mockOnboardingStore),
  }));
  return mockOnboardingStore;
}

export function setupAuthStoreMock(overrides?: Partial<MockAuthStore>) {
  mockAuthStore = createMockAuthStore(overrides);
  jest.mock('@/stores/auth', () => ({
    useAuthStore: createMockZustandHook(mockAuthStore),
  }));
  return mockAuthStore;
}

/**
 * Reset all mocks to default state
 */
export function resetAllStoreMocks() {
  jest.clearAllMocks();
  
  // Reset to default values
  Object.assign(mockCoachStore, createMockCoachStore());
  Object.assign(mockBouncePlanStore, createMockBouncePlanStore());
  Object.assign(mockBudgetStore, createMockBudgetStore());
  Object.assign(mockJobTrackerStore, createMockJobTrackerStore());
  Object.assign(mockWellnessStore, createMockWellnessStore());
  Object.assign(mockOnboardingStore, createMockOnboardingStore());
  Object.assign(mockAuthStore, createMockAuthStore());
}

/**
 * Common test setup that should be called in beforeEach
 */
export function setupStoreTests() {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetAllStoreMocks();
  });
}

/**
 * Usage example:
 * 
 * import { setupCoachStoreMock, mockCoachStore, setupStoreTests } from '@/test-utils/setupStores';
 * 
 * // At the top of your test file
 * setupCoachStoreMock({
 *   currentTone: 'hype',
 *   messages: [{ id: '1', message: 'Hello' }]
 * });
 * 
 * describe('MyComponent', () => {
 *   setupStoreTests(); // Sets up beforeEach/afterEach
 * 
 *   it('should do something', () => {
 *     // mockCoachStore is available for assertions and modifications
 *     mockCoachStore.sendMessage.mockResolvedValue(newMessage);
 *   });
 * });
 */