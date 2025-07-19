import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeThemeProvider } from '@components/common/SafeThemeProvider';
import { AuthProvider } from '@context/AuthContext';
import { OfflineProvider } from '@context/OfflineContext';
import { buildUser, buildNavigationProp } from '@test-utils/builders';
import { User } from '@supabase/supabase-js';
import { waitInAct, flushPromisesAndTimers } from '@test-utils/test-act-utils';
import { Theme } from '../theme';

// Export mock helpers for easy access
export { createMockStore, createMockNetInfoState, NETWORK_STATES } from './mockHelpers';
export * from './mocks/services';

/**
 * Custom render method that wraps components with necessary providers
 */

interface AllTheProvidersProps {
  children: React.ReactNode;
  user?: User | null;
  testTheme?: Partial<Theme>;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  user = buildUser(),
  testTheme
}) => {
  return (
    <NavigationContainer>
      <AuthProvider initialUser={user}>
        <SafeThemeProvider testTheme={testTheme}>
          <OfflineProvider>
            {children}
          </OfflineProvider>
        </SafeThemeProvider>
      </AuthProvider>
    </NavigationContainer>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null;
  testTheme?: Partial<Theme>;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const { user, testTheme, ...renderOptions } = options || {};
  
  const result = render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders user={user} testTheme={testTheme}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
  
  // Add helper to wait for providers to initialize
  const waitForProviders = async () => {
    await waitInAct(0);
    await flushPromisesAndTimers();
  };
  
  return {
    ...result,
    waitForProviders,
  };
};

/**
 * Helper to wait for async updates (wrapped in act)
 */
export const waitForAsync = async () => {
  await waitInAct(0);
};

/**
 * Mock console methods to reduce noise in tests
 */
export const silenceConsole = () => {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
};

/**
 * Setup mock timers for testing time-based features
 */
export const setupMockTimers = () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
};

/**
 * Mock AsyncStorage for testing
 */
export const mockAsyncStorage = () => {
  const store: Record<string, string> = {};
  
  const mockAsyncStorageImpl = {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys: string[]) => 
      Promise.resolve(keys.map(key => [key, store[key] || null]))
    ),
  };
  
  jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorageImpl);
  
  return { store, mock: mockAsyncStorageImpl };
};

/**
 * Create a mock navigation prop with common methods
 */
export const createMockNavigation = (overrides?: any) => {
  const navigation = buildNavigationProp(overrides);
  
  // Add common test helpers
  navigation.navigate.mockImplementation((screen: string, params?: any) => {
    console.log(`Navigate to ${screen}`, params);
  });
  
  return navigation;
};

/**
 * Test accessibility of a component
 */
export const testAccessibility = (component: React.ReactElement) => {
  const { getByRole, getByLabelText } = render(component);
  
  // This is a simplified version - in a real app you'd use
  // react-native-testing-library's accessibility APIs
  return {
    hasRole: (role: string) => {
      try {
        getByRole(role);
        return true;
      } catch {
        return false;
      }
    },
    hasLabel: (label: string) => {
      try {
        getByLabelText(label);
        return true;
      } catch {
        return false;
      }
    },
  };
};

/**
 * Helper to test loading states
 */
export const expectLoadingState = (
  getByTestId: (testId: string) => any,
  testId = 'loading-indicator'
) => {
  expect(getByTestId(testId)).toBeTruthy();
};

/**
 * Helper to test error states
 */
export const expectErrorState = (
  getByText: (text: string | RegExp) => any,
  errorMessage?: string | RegExp
) => {
  const message = errorMessage || /error|failed|problem/i;
  expect(getByText(message)).toBeTruthy();
};

/**
 * Create a resolved promise for mocking async functions
 */
export const resolvedPromise = <T,>(value: T) => 
  jest.fn().mockResolvedValue(value);

/**
 * Create a rejected promise for mocking async functions
 */
export const rejectedPromise = (error: Error | string) => 
  jest.fn().mockRejectedValue(
    typeof error === 'string' ? new Error(error) : error
  );

/**
 * Mock Supabase client
 */
export const createMockSupabaseClient = () => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  })),
  auth: {
    getUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
});

/**
 * Snapshot serializer for consistent date formatting in snapshots
 */
export const dateSerializer = {
  test: (val: any) => val instanceof Date,
  print: (val: Date) => `Date(${val.toISOString()})`,
};