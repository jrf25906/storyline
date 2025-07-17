# TypeScript Patterns and Best Practices

This document outlines the TypeScript patterns and solutions implemented to fix ~250 TypeScript errors in the Next Chapter codebase.

## Table of Contents
1. [Mock Helpers and Testing Patterns](#mock-helpers-and-testing-patterns)
2. [Type Guards and Error Handling](#type-guards-and-error-handling)
3. [Network State Mocking](#network-state-mocking)
4. [Store Mocking with Zustand](#store-mocking-with-zustand)
5. [Environment Variables in Tests](#environment-variables-in-tests)
6. [Theme System Usage](#theme-system-usage)
7. [Common Fixes Applied](#common-fixes-applied)

## Mock Helpers and Testing Patterns

### Location
- Mock helpers: `src/test-utils/mockHelpers.ts`
- Type guards: `src/utils/typeGuards.ts`

### Key Utilities Created

#### 1. createMockStore
Used for properly mocking Zustand stores in tests:

```typescript
import { createMockStore } from '@/test-utils/mockHelpers';

// Create a mock store with initial state
const mockStore = createMockStore({
  resumes: [],
  isLoading: false,
  error: null,
  // ... other state properties
});

// Use in tests
(useResumeStore as unknown as typeof mockStore).mockReturnValue(mockStore());
```

#### 2. createMockNetInfoState
Creates properly typed network state mocks:

```typescript
import { NETWORK_STATES, createMockNetInfoState } from '@/test-utils/mockHelpers';
import { NetInfoStateType } from '@react-native-community/netinfo';

// Use predefined states
mockNetInfo.fetch.mockResolvedValue(NETWORK_STATES.wifi);

// Or create custom states
const customState = createMockNetInfoState(NetInfoStateType.cellular);
```

## Type Guards and Error Handling

### Error Handling Pattern
Always use type guards for error handling:

```typescript
import { getErrorMessage, isError } from '@/utils/typeGuards';

try {
  // Some operation
} catch (error) {
  // Don't assume error.message exists
  const message = getErrorMessage(error);
  throw new Error(`Operation failed: ${message}`);
}
```

### Available Type Guards
- `isError(error: unknown): error is Error`
- `hasErrorMessage(error: unknown): error is { message: string }`
- `getErrorMessage(error: unknown): string`
- `isDefined<T>(value: T | null | undefined): value is T`
- `isNonEmptyString(value: unknown): value is string`
- `isValidDate(value: unknown): value is Date`

## Network State Mocking

### ❌ OLD Pattern (Causes TypeScript Errors)
```typescript
mockNetInfo.fetch.mockResolvedValue({
  type: 'wifi', // Error: string not assignable to NetInfoStateType
  isConnected: true,
  // ...
});
```

### ✅ NEW Pattern (Type-Safe)
```typescript
import { NetInfoStateType } from '@react-native-community/netinfo';
import { NETWORK_STATES } from '@/test-utils/mockHelpers';

// Option 1: Use predefined states
mockNetInfo.fetch.mockResolvedValue(NETWORK_STATES.wifi);
mockNetInfo.fetch.mockResolvedValue(NETWORK_STATES.none);
mockNetInfo.fetch.mockResolvedValue(NETWORK_STATES.offline);

// Option 2: Use NetInfoStateType enum
mockNetInfo.addEventListener.mockImplementation((callback) => {
  callback({
    ...NETWORK_STATES.wifi,
    type: NetInfoStateType.wifi,
  });
  return jest.fn();
});
```

## Store Mocking with Zustand

### ❌ OLD Pattern (Type Casting Errors)
```typescript
(useBouncePlanStore as jest.Mock).mockReturnValue({
  // ... state
});
```

### ✅ NEW Pattern (Type-Safe Mocking)
```typescript
import { createMockStore } from '@/test-utils/mockHelpers';

const mockStore = createMockStore({
  currentDay: 5,
  completedTasks: new Set(['task1', 'task2']),
  // ... rest of state
});

(useBouncePlanStore as unknown as typeof mockStore).mockReturnValue(mockStore());

// The mock has proper methods
mockStore.setState({ currentDay: 6 });
expect(mockStore.getState().currentDay).toBe(6);
```

## Environment Variables in Tests

### ❌ OLD Pattern (Read-Only Error)
```typescript
process.env.NODE_ENV = 'test'; // Error: Cannot assign to read-only property
```

### ✅ NEW Pattern (Using Object.defineProperty)
```typescript
beforeEach(() => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    configurable: true
  });
});

afterEach(() => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    configurable: true
  });
});
```

## Theme System Usage

### Theme Structure
The unified theme system exports from `src/theme/index.ts`:

```typescript
import { theme } from '@/theme';

// Access theme properties
const primaryColor = theme.colors.primary;
const spacing = theme.spacing.md;

// Typography with both old and new API support
const fontSize = theme.typography.sizes.body; // New API
const fontWeight = theme.typography.weights.bold; // New API
const headingStyle = theme.typography.heading2; // Old API compatibility
```

### Component Styles
```typescript
import { theme } from '@/theme';

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.medium,
  },
  title: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
});
```

## Common Fixes Applied

### 1. React Native Keychain API
```typescript
// ❌ OLD
Keychain.setInternetCredentials(server, username, password);

// ✅ NEW
Keychain.setInternetCredentials({ 
  server: serviceName, 
  username, 
  password 
});
```

### 2. Expo Document Picker API
```typescript
// ❌ OLD
if (result.type === 'success') { }

// ✅ NEW
if (!result.canceled) { }
```

### 3. Expo Notifications API
```typescript
// ❌ OLD
{
  shouldShowAlert: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
}

// ✅ NEW
{
  shouldShowAlert: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
  shouldShowBanner: true,
  shouldShowList: true,
}
```

### 4. Notification Triggers
```typescript
// ❌ OLD
trigger: { hour: 9, minute: 0, repeats: true }

// ✅ NEW
trigger: {
  type: 'calendar' as const,
  hour: 9,
  minute: 0,
  repeats: true,
}
```

### 5. Type Annotations
```typescript
// ❌ OLD
const timeoutId = setTimeout(() => {}, 1000);

// ✅ NEW
const timeoutId = setTimeout(() => {}, 1000) as unknown as NodeJS.Timeout;
```

### 6. Financial Runway Type
Added missing `totalMonths` property to `FinancialRunway` interface for backward compatibility.

### 7. Navigation Types
Added missing exports to `src/types/navigation.ts`:
- `RootStackParamList`
- `MainTabScreenProps`
- `RootStackScreenProps`

## Testing Best Practices

1. **Always use mock helpers** for consistency
2. **Import types explicitly** from their packages
3. **Use type guards** for runtime type checking
4. **Avoid type assertions** unless absolutely necessary
5. **Prefer unknown over any** when type is truly unknown
6. **Mock at the module boundary** not implementation details

## Future Improvements

See the project todo list for planned architectural improvements:
1. Central error handling with AppError class
2. useThemeColors hook for standardized theme access
3. Type-safe navigation helpers
4. API abstraction layer for third-party dependencies

---

*Last updated: January 2025*
*Total TypeScript errors fixed: ~250*
*Remaining errors: ~110 (mostly edge cases)*