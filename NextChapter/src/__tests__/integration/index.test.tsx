/**
 * Integration Test Suite Runner
 * 
 * This file imports and runs all critical integration tests to ensure
 * the core user flows work correctly end-to-end.
 * 
 * Critical User Flows Tested:
 * 1. Onboarding → First Task
 * 2. Task Completion → Progress Update
 * 3. Offline → Online Sync
 * 4. Crisis Keyword → Resource Display
 * 5. Budget Entry → Runway Calculation
 */

// Import all integration test suites
import './onboarding-flow.test';
import './task-completion-flow.test';
import './offline-sync-flow.test';
import './crisis-support-flow.test';
import './budget-runway-flow.test';

describe('Integration Test Suite', () => {
  it('should run all critical user flow tests', () => {
    // This test serves as a marker that all integration tests are included
    expect(true).toBe(true);
  });
});

/**
 * To run only integration tests:
 * npm test -- --testPathPattern="integration"
 * 
 * To run a specific flow:
 * npm test -- --testPathPattern="onboarding-flow"
 * npm test -- --testPathPattern="task-completion-flow"
 * npm test -- --testPathPattern="offline-sync-flow"
 * npm test -- --testPathPattern="crisis-support-flow"
 * npm test -- --testPathPattern="budget-runway-flow"
 */