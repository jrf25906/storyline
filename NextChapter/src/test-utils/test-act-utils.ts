import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';

/**
 * Wrapper for async operations in tests to avoid act warnings
 */
export const actAsync = async (callback: () => Promise<void>) => {
  await act(async () => {
    await callback();
  });
};

/**
 * Wait for a specified time or until a callback completes
 */
export const waitInAct = async (timeOrCallback?: number | (() => void | Promise<void>), options?: { timeout?: number }) => {
  if (typeof timeOrCallback === 'number') {
    // If a number is passed, wait for that many milliseconds
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, timeOrCallback));
    });
  } else if (typeof timeOrCallback === 'function') {
    // If a function is passed, wait for it to complete
    await waitFor(async () => {
      await act(async () => {
        await timeOrCallback();
      });
    }, options);
  } else {
    // If nothing is passed, just wait for next tick
    await act(async () => {
      await Promise.resolve();
    });
  }
};

/**
 * Advance timers with act wrapper
 */
export const advanceTimersWithAct = async (time: number) => {
  await act(async () => {
    jest.advanceTimersByTime(time);
    // Allow microtasks to run
    await Promise.resolve();
  });
};

/**
 * Run all timers with act wrapper
 */
export const runAllTimersWithAct = async () => {
  await act(async () => {
    jest.runAllTimers();
    // Allow microtasks to run
    await Promise.resolve();
  });
};

/**
 * Run pending timers with act wrapper
 */
export const runPendingTimersWithAct = async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
    // Allow microtasks to run
    await Promise.resolve();
  });
};

/**
 * Flush all promises and pending timers
 */
export const flushPromisesAndTimers = async () => {
  await act(async () => {
    // Run all pending timers
    if (jest.isMockFunction(setTimeout)) {
      jest.runOnlyPendingTimers();
    }
    // Flush all promises
    await new Promise(process.nextTick);
  });
};