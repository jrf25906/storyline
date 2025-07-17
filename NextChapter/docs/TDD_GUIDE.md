# Test-Driven Development (TDD) Guide

## Overview
This guide outlines TDD practices for the Next Chapter React Native app. Following TDD ensures code quality, reduces bugs, and provides confidence when making changes.

## TDD Workflow

### 1. Red Phase - Write a Failing Test
```typescript
it('should display user name', () => {
  const { getByText } = render(<UserProfile name="John Doe" />);
  expect(getByText('John Doe')).toBeTruthy();
});
```

### 2. Green Phase - Make it Pass
```typescript
export const UserProfile = ({ name }) => {
  return <Text>{name}</Text>;
};
```

### 3. Refactor Phase - Improve the Code
```typescript
export const UserProfile: React.FC<UserProfileProps> = ({ name }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};
```

## Available Test Commands

```bash
# Run all tests
npm test

# Watch mode for TDD
npm run test:tdd

# Run tests for changed files only
npm run test:changed

# Run tests related to specific files
npm run test:related src/components/Button.tsx

# Check coverage
npm run test:coverage:summary
```

## Test Templates

Test templates are available in `src/test-utils/templates/`:
- `component.test.template.tsx` - For UI components
- `screen.test.template.tsx` - For screen components with navigation
- `store.test.template.ts` - For Zustand stores
- `service.test.template.ts` - For API services

## Testing Best Practices

### 1. Component Testing
- Test user interactions, not implementation details
- Verify accessibility properties
- Test both light and dark modes
- Mock external dependencies

```typescript
it('should be accessible', () => {
  const { getByRole, getByLabelText } = render(
    <Button onPress={jest.fn()}>Submit</Button>
  );
  
  expect(getByRole('button')).toBeTruthy();
  expect(getByLabelText('Submit')).toBeTruthy();
});
```

### 2. Async Testing
- Always use `waitFor` for async operations
- Use `act` for state updates

```typescript
it('should load data', async () => {
  const { getByText } = render(<DataList />);
  
  await waitFor(() => {
    expect(getByText('Loaded Data')).toBeTruthy();
  });
});
```

### 3. Store Testing
- Reset store state between tests
- Test actions and computed values separately

```typescript
beforeEach(() => {
  const { result } = renderHook(() => useStore());
  act(() => {
    result.current.reset();
  });
});
```

### 4. Service Testing
- Mock external APIs (Supabase, etc.)
- Test error scenarios
- Verify retry logic

```typescript
it('should handle API errors', async () => {
  mockSupabase.from.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Network error' }
    })
  });
  
  await expect(service.getData()).rejects.toThrow('Network error');
});
```

## Coverage Requirements

### Global Thresholds
- Lines: 80%
- Statements: 80%
- Functions: 75%
- Branches: 75%

### Critical Path Requirements
- Emergency services: 100% coverage
- Security services: 100% coverage
- Offline sync: 85% coverage

## Pre-commit Hooks

Tests run automatically before commits via lint-staged:
1. ESLint fixes applied
2. Related tests run
3. Commit blocked if tests fail

To bypass (emergency only):
```bash
git commit --no-verify -m "Emergency fix"
```

## Common Testing Patterns

### 1. Mocking Theme Context
```typescript
const mockTheme = {
  colors: {
    primary: '#2D5A27',
    background: '#FDFCF8',
  },
};

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
}));
```

### 2. Mocking Navigation
```typescript
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));
```

### 3. Mocking Async Storage
```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
```

### 4. Testing Animations
```typescript
it('should animate on press', () => {
  const animationSpy = jest.spyOn(Animated, 'timing');
  
  fireEvent.press(getByText('Animate'));
  
  expect(animationSpy).toHaveBeenCalledWith(
    expect.any(Object),
    expect.objectContaining({ toValue: 1 })
  );
});
```

## Debugging Tests

### 1. Use debug() to inspect component tree
```typescript
const { debug } = render(<Component />);
debug(); // Prints component tree
```

### 2. Check specific props
```typescript
const button = getByTestId('submit-button');
console.log(button.props); // Inspect all props
```

### 3. Wait for async updates
```typescript
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
}, { timeout: 3000 });
```

## CI/CD Integration

Tests run on every PR with:
- Coverage reports posted as comments
- Merge blocked if coverage drops
- Performance benchmarks tracked

## Remember

1. **Write tests first** - Let tests drive your implementation
2. **Test behavior, not implementation** - Focus on what users see/do
3. **Keep tests simple** - Each test should verify one thing
4. **Mock at boundaries** - Mock external dependencies, not internal logic
5. **Test the unhappy path** - Error states are as important as success

## Resources

- [React Native Testing Library Docs](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)
- Project test examples: `/src/**/__tests__/`