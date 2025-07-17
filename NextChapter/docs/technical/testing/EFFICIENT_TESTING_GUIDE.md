# Efficient Testing Quick Reference Guide

## 🚀 Speed Hacks for Test Creation

### 1. Component Test Template (Copy-Paste Ready)
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  const defaultProps = {
    // Add common props here
  };

  const renderComponent = (props = {}) => {
    return render(<ComponentName {...defaultProps} {...props} />);
  };

  it('renders correctly', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('component-name')).toBeTruthy();
  });

  it('handles user interaction', () => {
    const onPress = jest.fn();
    const { getByRole } = renderComponent({ onPress });
    
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### 2. Screen Test Template (With Navigation)
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, waitFor } from '@testing-library/react-native';
import { ScreenName } from '../ScreenName';
import { createMockAuthStore } from '@/test-utils/mockHelpers';

describe('ScreenName', () => {
  const mockNavigate = jest.fn();
  const mockRoute = { params: {} };

  beforeEach(() => {
    const mockStore = createMockAuthStore({ isAuthenticated: true });
    (useAuthStore as any).mockReturnValue(mockStore());
  });

  const renderScreen = () => {
    return render(
      <NavigationContainer>
        <ScreenName navigation={{ navigate: mockNavigate }} route={mockRoute} />
      </NavigationContainer>
    );
  };

  it('renders loading state initially', () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('navigates correctly', async () => {
    const { getByText } = renderScreen();
    
    await waitFor(() => {
      fireEvent.press(getByText('Next'));
      expect(mockNavigate).toHaveBeenCalledWith('NextScreen');
    });
  });
});
```

### 3. Store Test Template
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useStoreNameStore } from '../storeNameStore';

describe('StoreNameStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useStoreNameStore.setState(useStoreNameStore.getInitialState());
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useStoreNameStore());
    
    act(() => {
      result.current.updateSomething('new value');
    });
    
    expect(result.current.something).toBe('new value');
  });
});
```

## ⚡ Batch Test Generation Scripts

### Generate Multiple Component Tests
```bash
# Create this as scripts/generate-tests.js
const fs = require('fs');
const path = require('path');

const components = fs.readdirSync('./src/components/common')
  .filter(f => f.endsWith('.tsx') && !f.includes('.test'));

components.forEach(file => {
  const name = file.replace('.tsx', '');
  const testContent = `// Auto-generated test
import React from 'react';
import { render } from '@testing-library/react-native';
import { ${name} } from '../${name}';

describe('${name}', () => {
  it('renders without crashing', () => {
    const { container } = render(<${name} />);
    expect(container).toBeTruthy();
  });
});`;

  fs.writeFileSync(
    `./src/components/common/__tests__/${name}.test.tsx`,
    testContent
  );
});
```

## 🎯 High-Impact Testing Patterns

### 1. Snapshot Testing for UI Components
```typescript
it('matches snapshot', () => {
  const tree = render(<Button title="Test" />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

### 2. Testing Async Operations
```typescript
it('loads data successfully', async () => {
  const { getByText, queryByTestId } = render(<DataComponent />);
  
  // Initially shows loading
  expect(queryByTestId('loading')).toBeTruthy();
  
  // Wait for data
  await waitFor(() => {
    expect(getByText('Data loaded')).toBeTruthy();
  });
  
  // Loading gone
  expect(queryByTestId('loading')).toBeFalsy();
});
```

### 3. Testing Error States
```typescript
it('handles errors gracefully', async () => {
  // Mock API failure
  mockApi.getData.mockRejectedValue(new Error('Network error'));
  
  const { getByText } = render(<Component />);
  
  await waitFor(() => {
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
```

## 🔥 Coverage Boosting Strategies

### 1. Test All Conditional Branches
```typescript
describe('conditional rendering', () => {
  it('shows content when authenticated', () => {
    const { getByText } = render(<Component isAuth={true} />);
    expect(getByText('Welcome')).toBeTruthy();
  });
  
  it('shows login when not authenticated', () => {
    const { getByText } = render(<Component isAuth={false} />);
    expect(getByText('Please login')).toBeTruthy();
  });
});
```

### 2. Test Edge Cases
```typescript
describe('edge cases', () => {
  it.each([
    [null, 'No data'],
    [[], 'No data'],
    [undefined, 'No data'],
    [[{id: 1}], '1 item'],
  ])('handles %p correctly', (input, expected) => {
    const { getByText } = render(<List data={input} />);
    expect(getByText(expected)).toBeTruthy();
  });
});
```

### 3. Test Accessibility
```typescript
it('is accessible', () => {
  const { getByLabelText, getByRole } = render(<Form />);
  
  expect(getByLabelText('Email')).toBeTruthy();
  expect(getByRole('button', { name: 'Submit' })).toBeTruthy();
});
```

## 🛠️ Debugging Failed Tests

### Quick Debugging Commands
```bash
# Run single test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders"

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand Button.test.tsx

# Update snapshots
npm test -- -u
```

### Common Fixes
```typescript
// Fix: Cannot find module
jest.mock('@/utils/helpers', () => ({
  helperFunction: jest.fn(),
}));

// Fix: Async not completing
await act(async () => {
  await userEvent.click(button);
});

// Fix: State not updating
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeTruthy();
});
```

## 📊 Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# Coverage for specific file
npm test -- --coverage --collectCoverageFrom=src/components/Button.tsx

# Open coverage in browser
npm run test:coverage && open coverage/lcov-report/index.html

# Check coverage thresholds
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## 🏃‍♂️ Speed Optimizations

### 1. Parallel Test Execution
```json
// jest.config.js
{
  "maxWorkers": "50%",
  "testTimeout": 10000
}
```

### 2. Focused Testing During Development
```typescript
// Only run this test
it.only('critical test', () => {});

// Skip this test temporarily
it.skip('flaky test', () => {});

// Run only changed files
npm test -- -o
```

### 3. Mock Heavy Operations
```typescript
// Mock expensive imports
jest.mock('react-native-reanimated', () => 
  require('react-native-reanimated/mock')
);

// Mock timers for faster execution
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
```

## 🎪 Test Organization Best Practices

### File Structure
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.styles.ts
├── ComponentName.types.ts
└── __tests__/
    ├── ComponentName.test.tsx
    ├── ComponentName.integration.test.tsx
    └── __snapshots__/
```

### Naming Conventions
- `*.test.tsx` - Unit tests
- `*.integration.test.tsx` - Integration tests
- `*.e2e.test.tsx` - End-to-end tests

### Test Descriptions
```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    it('displays the title prop correctly', () => {});
  });
  
  describe('user interactions', () => {
    it('calls onPress when button is tapped', () => {});
  });
  
  describe('error handling', () => {
    it('shows error message when API fails', () => {});
  });
});
```

## 🚨 Remember
- **Test behavior, not implementation**
- **Write tests that give confidence**
- **Keep tests simple and readable**
- **One assertion per test when possible**
- **Use descriptive test names**

---

💡 **Pro Tip**: Set up a keyboard shortcut to run the test for the current file you're editing. This makes TDD much faster!