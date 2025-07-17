// Re-export all mock helpers
export * from './mockHelpers';

// Re-export test utilities if they exist
export * from './testUtils';

// Common test setup
export const setupTest = () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Reset modules if needed
  afterEach(() => {
    jest.resetModules();
  });
};

// Helper to wait for async updates
export const waitForAsync = () => new Promise(resolve => setImmediate(resolve));