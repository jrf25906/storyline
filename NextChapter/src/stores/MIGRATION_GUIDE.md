# Store Refactoring Migration Guide

## Overview
This guide outlines the process for migrating from the old Zustand store implementations to the new SOLID-compliant, factory-based stores.

## Migration Status

### ✅ Completed
- `budgetStore`
- `bouncePlanStore`
- `coachStore`
- `jobTrackerStore`
- `moodStore`
- `uiStore`
- `userStore` (just completed)

### 🚧 Pending
- `authStore` - Note: Currently uses AuthContext wrapper
- `jobApplicationStore`
- `offlineStore`
- `onboardingStore`
- `resumeStore`
- `wellnessStore`

## Migration Steps

### 1. Create Store Interface
Create an interface in `src/stores/interfaces/[storeName].ts`:

```typescript
import { BaseStore, BaseState, AsyncResult } from './base';

// Define state interface
export interface StoreNameState extends BaseState {
  // State properties
}

// Define operation interfaces (SRP)
export interface OperationGroup1 {
  method1: () => AsyncResult;
  method2: (param: Type) => AsyncResult;
}

// Compose final interface
export interface IStoreName extends 
  BaseStore,
  StoreNameState,
  OperationGroup1 {
  // Additional methods
}
```

### 2. Implement Refactored Store
Create the refactored store in `src/stores/refactored/[storeName].ts`:

```typescript
import { StateCreator } from 'zustand';
import { createStore, createInitialState, handleAsyncOperation } from '../factory/createStore';
import { IStoreName } from '../interfaces/[storeName]';

const initialState = createInitialState<Omit<StoreNameState, 'isLoading' | 'error'>>({
  // Initial values
});

const storeCreator: StateCreator<IStoreName, [], [], IStoreName> = (set, get) => ({
  ...initialState,
  
  // Implement methods using handleAsyncOperation
  method1: async () => {
    return handleAsyncOperation(
      set,
      async () => {
        // Async operation
      },
      {
        onSuccess: (result) => set({ /* update state */ }),
        onError: (error) => console.error('Error:', error),
      }
    );
  },
  
  reset: () => set(initialState),
});

export const useStoreName = createStore<IStoreName>(
  storeCreator,
  {
    name: 'store-name',
    persist: true, // if needed
    partialize: (state) => ({ /* persisted properties */ }),
  }
);
```

### 3. Update Import Paths
Create a temporary compatibility layer in the original store file:

```typescript
// src/stores/[storeName].ts
export { useStoreName } from './refactored/[storeName]';
```

### 4. Test Migration
1. Run existing tests to ensure compatibility
2. Add new tests for refactored functionality
3. Test persistence if applicable
4. Verify async operations handle errors correctly

### 5. Gradual Rollout
1. Use feature flags if needed:
```typescript
const USE_REFACTORED_STORE = process.env.USE_REFACTORED_STORE === 'true';

export const useStoreName = USE_REFACTORED_STORE 
  ? require('./refactored/storeName').useStoreName
  : require('./legacy/storeName').useStoreName;
```

2. Monitor for issues in development/staging
3. Remove old implementation after verification

## Benefits of Refactored Stores

### SOLID Principles Applied
- **SRP**: Each store has a single responsibility
- **OCP**: Easy to extend without modifying existing code
- **LSP**: All stores implement BaseStore interface
- **ISP**: Operation interfaces are segregated by concern
- **DIP**: Stores depend on interfaces, not concrete implementations

### DRY Improvements
- Common async operation handling via `handleAsyncOperation`
- Standardized initial state creation
- Reusable factory pattern
- Consistent error handling

### Type Safety
- Full TypeScript support
- Type-safe state and actions
- Compile-time error detection

### Testing Benefits
- Easier to mock with interfaces
- Isolated testing of operations
- Consistent test patterns

## Common Patterns

### Async Operations
```typescript
methodName: async (param: Type) => {
  return handleAsyncOperation(
    set,
    async () => {
      const result = await apiCall(param);
      return result;
    },
    {
      onSuccess: (data) => set({ stateProperty: data }),
      loadingKey: 'isLoading', // optional, defaults to 'isLoading'
      errorKey: 'error', // optional, defaults to 'error'
    }
  );
}
```

### Conditional Operations
```typescript
conditionalMethod: async () => {
  const { requiredState } = get();
  if (!requiredState) {
    throw new Error('Required state not available');
  }
  
  return handleAsyncOperation(set, async () => {
    // Operation using requiredState
  });
}
```

### Composite Operations
```typescript
compositeMethod: async () => {
  await get().operation1();
  await get().operation2();
  // Additional logic
}
```

## Next Steps

1. Continue refactoring remaining stores in priority order:
   - `offlineStore` (critical for offline functionality)
   - `onboardingStore` (important for user flow)
   - `wellnessStore`
   - `resumeStore`
   - `jobApplicationStore`

2. Update documentation for each refactored store

3. Create integration tests for cross-store interactions

4. Remove legacy store implementations after full migration