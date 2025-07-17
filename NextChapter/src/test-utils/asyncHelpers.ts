import { waitFor } from '@testing-library/react-native';
import { act } from '@testing-library/react-hooks';

/**
 * Wait for all promises to resolve and timers to execute
 * Useful for tests that involve multiple async operations
 */
export const waitForAsync = async (timeout = 1000) => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  
  // If using fake timers, advance them
  if (jest.isMockFunction(setTimeout)) {
    jest.runAllTimers();
  }
};

/**
 * Wait for a condition to be true with retries
 * @param condition Function that returns true when condition is met
 * @param options Timeout and interval options
 */
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
) => {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return true;
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

/**
 * Helper to test loading states
 * @param asyncFn The async function to test
 * @param getLoadingState Function to get the current loading state
 */
export const testLoadingState = async (
  asyncFn: () => Promise<any>,
  getLoadingState: () => boolean
) => {
  expect(getLoadingState()).toBe(false);
  
  const promise = asyncFn();
  
  // Check loading state is true immediately after calling
  expect(getLoadingState()).toBe(true);
  
  await promise;
  
  // Check loading state is false after completion
  expect(getLoadingState()).toBe(false);
};

/**
 * Helper for testing error handling in async operations
 */
export const testAsyncError = async (
  asyncFn: () => Promise<any>,
  expectedError: string | RegExp,
  getError: () => string | null
) => {
  // Clear any existing error
  expect(getError()).toBeNull();
  
  try {
    await asyncFn();
    fail('Expected function to throw');
  } catch (error) {
    // Expected to throw
  }
  
  await waitForAsync();
  
  const actualError = getError();
  expect(actualError).toBeTruthy();
  
  if (typeof expectedError === 'string') {
    expect(actualError).toContain(expectedError);
  } else {
    expect(actualError).toMatch(expectedError);
  }
};

/**
 * Wrapper for async store actions that ensures proper cleanup
 */
export const withStoreCleanup = async (
  testFn: () => Promise<void>,
  cleanup: () => void
) => {
  try {
    await testFn();
  } finally {
    await act(async () => {
      cleanup();
    });
  }
};

/**
 * Mock timer helpers for consistent async testing
 */
export const useFakeTimers = () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
};

/**
 * Helper to wait for multiple async operations
 */
export const waitForAll = async (promises: Promise<any>[]) => {
  await act(async () => {
    await Promise.all(promises);
  });
};

/**
 * Retry helper for flaky async operations
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 100
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
};