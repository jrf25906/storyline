# Store Mocking Guide for NextChapter

This guide explains how to properly mock Zustand stores in your tests to avoid common errors like "is not a function" and "mockReturnValue is not a function".

## Common Patterns

### 1. Basic Store Mocking (Recommended)

```typescript
import { createMockCoachStore, createMockZustandHook } from '@/test-utils/mockHelpers';

// Mock the store module
jest.mock('@/stores/coach', () => ({
  useCoachStore: createMockZustandHook(createMockCoachStore())
}));

// In your test
it('should use coach store', () => {
  const { result } = renderHook(() => useCoachStore());
  
  // Access store methods
  expect(result.current.sendMessage).toBeDefined();
  expect(result.current.clearConversations).toBeDefined();
});
```

### 2. Mocking with Custom State

```typescript
import { createMockCoachStore, createMockZustandHook } from '@/test-utils/mockHelpers';

// Create mock with overrides
const mockStore = createMockCoachStore({
  messages: [{ id: '1', message: 'Hello', role: 'user' }],
  currentTone: 'hype',
  isLoading: true
});

jest.mock('@/stores/coach', () => ({
  useCoachStore: createMockZustandHook(mockStore)
}));
```

### 3. Mocking Store Methods with Custom Behavior

```typescript
const mockStore = createMockCoachStore({
  sendMessage: jest.fn().mockResolvedValue({
    id: 'test-id',
    message: 'Test message',
    role: 'user',
    timestamp: new Date()
  })
});

jest.mock('@/stores/coach', () => ({
  useCoachStore: createMockZustandHook(mockStore)
}));

// In your test
it('should send message', async () => {
  const { result } = renderHook(() => useCoachStore());
  
  const message = await result.current.sendMessage('user-id', 'Hello');
  
  expect(message).toEqual({
    id: 'test-id',
    message: 'Test message',
    role: 'user',
    timestamp: expect.any(Date)
  });
});
```

### 4. Testing Components with Store Dependencies

```typescript
import { render } from '@testing-library/react-native';
import { createMockBouncePlanStore, createMockZustandHook } from '@/test-utils/mockHelpers';
import { TaskCard } from '@/components/feature/bounce-plan/TaskCard';

// Mock the store
const mockStore = createMockBouncePlanStore({
  tasks: [
    { id: '1', title: 'Task 1', completed: false },
    { id: '2', title: 'Task 2', completed: true }
  ],
  completeTask: jest.fn().mockResolvedValue(undefined)
});

jest.mock('@/stores/bouncePlan', () => ({
  useBouncePlanStore: createMockZustandHook(mockStore)
}));

describe('TaskCard', () => {
  it('should complete task when pressed', async () => {
    const { getByText } = render(<TaskCard taskId="1" />);
    
    fireEvent.press(getByText('Complete'));
    
    await waitFor(() => {
      expect(mockStore.completeTask).toHaveBeenCalledWith('user-id', '1');
    });
  });
});
```

### 5. Testing Store Selectors

```typescript
// Mock with selector support
const mockStore = createMockCoachStore({
  messages: [/* ... */],
  currentTone: 'pragmatist'
});

jest.mock('@/stores/coach', () => ({
  useCoachStore: createMockZustandHook(mockStore)
}));

// Test component using selector
it('should select current tone', () => {
  const { result } = renderHook(() => 
    useCoachStore(state => state.currentTone)
  );
  
  expect(result.current).toBe('pragmatist');
});
```

## Available Mock Factories

### Coach Store
```typescript
const mockStore = createMockCoachStore({
  conversations: [],
  currentTone: 'pragmatist',
  sendMessage: jest.fn(),
  clearConversations: jest.fn(),
  // ... any other overrides
});
```

### Bounce Plan Store
```typescript
const mockStore = createMockBouncePlanStore({
  tasks: [],
  currentDay: 5,
  resetPlan: jest.fn(), // Note: resetPlan is an alias for resetProgress
  completeTask: jest.fn(),
  // ... any other overrides
});
```

### Budget Store
```typescript
const mockStore = createMockBudgetStore({
  budgetData: { monthlyIncome: 5000, monthlyExpenses: 3000 },
  runway: { runwayInDays: 90, isLowRunway: false },
  calculateRunway: jest.fn(),
  // ... any other overrides
});
```

### Job Tracker Store
```typescript
const mockStore = createMockJobTrackerStore({
  applications: [],
  selectedStatus: 'interviewing',
  addApplication: jest.fn(),
  updateApplicationStatus: jest.fn(),
  // ... any other overrides
});
```

### Wellness Store
```typescript
const mockStore = createMockWellnessStore({
  moods: [],
  getTrend: jest.fn(() => 'improving'),
  addMood: jest.fn(),
  // ... any other overrides
});
```

### Onboarding Store
```typescript
const mockStore = createMockOnboardingStore({
  currentStep: 2,
  totalSteps: 5,
  data: { name: 'John Doe' },
  nextStep: jest.fn(),
  // ... any other overrides
});
```

### Auth Store
```typescript
const mockStore = createMockAuthStore({
  user: { id: '123', email: 'test@example.com' },
  session: { token: 'mock-token' },
  signIn: jest.fn(),
  // ... any other overrides
});
```

## Common Pitfalls and Solutions

### Issue: "mockReturnValue is not a function"
**Solution**: Use `createMockZustandHook` wrapper which properly implements the hook behavior.

```typescript
// ❌ Wrong
jest.mock('@/stores/coach', () => ({
  useCoachStore: jest.fn()
}));

// ✅ Correct
jest.mock('@/stores/coach', () => ({
  useCoachStore: createMockZustandHook(createMockCoachStore())
}));
```

### Issue: "result.current.methodName is not a function"
**Solution**: Ensure the mock store includes all methods the test expects.

```typescript
// ❌ Wrong - missing methods
const mockStore = { 
  messages: [],
  // Missing sendMessage, clearConversations, etc.
};

// ✅ Correct - use factory with all methods
const mockStore = createMockCoachStore({
  messages: []
});
```

### Issue: Store state not updating in tests
**Solution**: Mock the state updates explicitly.

```typescript
const mockStore = createMockCoachStore();

// Mock state change
mockStore.sendMessage.mockImplementation(async () => {
  mockStore.messages = [...mockStore.messages, newMessage];
  return newMessage;
});
```

## Testing Offline/Sync Behavior

```typescript
const mockStore = createMockJobTrackerStore({
  offlineQueue: [{ id: '1', status: 'pending' }],
  hasPendingSyncs: jest.fn(() => true),
  syncWithSupabase: jest.fn().mockResolvedValue(undefined)
});

it('should sync offline changes', async () => {
  const { result } = renderHook(() => useJobTrackerStore());
  
  expect(result.current.hasPendingSyncs()).toBe(true);
  
  await act(async () => {
    await result.current.syncWithSupabase();
  });
  
  expect(mockStore.syncWithSupabase).toHaveBeenCalled();
});
```

## Best Practices

1. **Always use mock factories**: They ensure all required properties and methods are present.

2. **Mock at the module level**: Use `jest.mock()` at the top of your test file.

3. **Reset mocks between tests**: 
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

4. **Test behavior, not implementation**: Focus on what the store does, not how it does it.

5. **Use TypeScript**: The mock interfaces help catch missing properties at compile time.

6. **Keep mocks simple**: Only override what's necessary for your specific test.

## Troubleshooting

If you encounter issues:

1. Check that all store methods used in your component/hook are included in the mock
2. Verify the import paths match exactly (e.g., `@/stores/coach` vs `../stores/coach`)
3. Ensure mock setup happens before component imports
4. Use `console.log(result.current)` to inspect what the hook returns

Remember: The goal is to isolate the unit under test while providing realistic store behavior.