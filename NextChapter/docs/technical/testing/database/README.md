# Bounce Plan Sync Testing Documentation

## Overview
This directory contains comprehensive tests for the Bounce Plan sync functionality, ensuring data integrity between local storage and Supabase cloud database.

## Test Structure

### Unit Tests
- **bouncePlan.test.ts**: Tests for the database service layer
  - CRUD operations (Create, Read, Update, Delete)
  - Error handling and edge cases
  - Network failure scenarios
  - Data validation

### Store Tests
- **../../../stores/__tests__/bouncePlanStore.test.ts**: Basic store functionality
- **../../../stores/__tests__/bouncePlanStore.sync.test.ts**: Sync-specific store tests
  - Hydration from database
  - Sync to database
  - Conflict resolution
  - Offline/online scenarios

### Integration Tests
- **../../../screens/main/__tests__/BouncePlanScreen.sync.test.tsx**: Full integration tests
  - User interactions triggering sync
  - Network state changes
  - UI feedback during sync
  - Error recovery flows

## Test Coverage Requirements
- Minimum 80% coverage for all sync-related code
- 100% coverage for critical paths (data loss prevention)
- Edge cases and error scenarios must be tested

## Running Tests

### Run all sync tests
```bash
npm test -- --testPathPattern="sync|bouncePlan"
```

### Run with coverage
```bash
npm test -- --coverage --testPathPattern="sync|bouncePlan"
```

### Run specific test file
```bash
npm test src/services/database/__tests__/bouncePlan.test.ts
```

### Watch mode for development
```bash
npm test -- --watch --testPathPattern="bouncePlan"
```

## Key Test Scenarios

### 1. Offline-First Behavior
- Tasks completed offline are queued
- Sync occurs when connection restored
- Local changes preserved during offline period

### 2. Conflict Resolution
- Last-write-wins strategy
- Local changes overwrite server data
- User notified of conflicts

### 3. Data Integrity
- No data loss during sync failures
- Partial sync failures handled gracefully
- Consistency between local and remote state

### 4. Performance
- Debounced sync for rapid updates
- Batch sync for multiple changes
- Minimal network requests

## Mock Strategy

### Supabase Client
```typescript
jest.mock('@services/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}));
```

### AsyncStorage
```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
```

### Network Info
```typescript
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));
```

## Test Data Builders

Use the builders in `src/test-utils/builders/bouncePlan.ts`:

```typescript
import { 
  buildBouncePlanTask,
  buildCompletedTask,
  buildSkippedTask,
  buildFullBouncePlan,
  testScenarios,
} from '@test-utils/builders/bouncePlan';

// Create test data
const completedTask = buildCompletedTask(1, 'day1_breathe', {
  notes: 'Feeling better',
});

const activeUserScenario = testScenarios.activeUser();
```

## Common Test Patterns

### Testing Async Operations
```typescript
await act(async () => {
  await result.current.hydrateFromDatabase('user123');
});
```

### Testing Loading States
```typescript
act(() => {
  result.current.hydrateFromDatabase('user123');
});
expect(result.current.isLoading).toBe(true);

await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```

### Testing Error Scenarios
```typescript
mockService.loadBouncePlanProgress.mockRejectedValue(
  new Error('Network error')
);

await act(async () => {
  await result.current.hydrateFromDatabase('user123');
});

expect(result.current.syncError).toBe('Failed to load progress from server');
```

## Debugging Tests

### Enable Verbose Logging
```bash
DEBUG=next-chapter:* npm test
```

### Run Single Test
```typescript
it.only('should sync when coming back online', async () => {
  // Test implementation
});
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--testPathPattern=bouncePlan"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Commits to main branch
- Pre-deployment checks

Failed tests block deployment to ensure data integrity.

## Troubleshooting

### "Cannot find module" Errors
- Ensure all imports use path aliases (@services, @stores, etc.)
- Run `npm install` to ensure dependencies are installed

### Flaky Tests
- Check for missing `await` statements
- Ensure proper test isolation (clear mocks between tests)
- Use `waitFor` for async state changes

### Coverage Gaps
- Run coverage report: `npm test -- --coverage`
- Focus on untested error paths and edge cases
- Add tests for any sync-related code below 80% coverage