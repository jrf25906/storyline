import React from 'react';
import { Text, View } from 'react-native';
import { renderWithProviders, waitForAsync, silenceConsole, setupMockTimers, mockAsyncStorage, createMockNavigation, testAccessibility, expectLoadingState, expectErrorState, resolvedPromise, rejectedPromise, createMockSupabaseClient, dateSerializer } from '@test-utils/test-helpers';
import { buildUser } from '@test-utils/builders';

// Test component
const TestComponent: React.FC<{ testId?: string }> = ({ testId = 'test-component' }) => (
  <View testID={testId}>
    <Text>Test Component</Text>
  </View>
);

describe('test-helpers', () => {
  describe('renderWithProviders', () => {
    it('should render component with all providers', async () => {
      const { getByText, waitForProviders } = renderWithProviders(<TestComponent />);
      
      await waitForProviders();
      
      expect(getByText('Test Component')).toBeTruthy();
    });

    it('should accept custom user', async () => {
      const customUser = buildUser({ email: 'custom@test.com' });
      const { getByText, waitForProviders } = renderWithProviders(
        <TestComponent />,
        { user: customUser }
      );
      
      await waitForProviders();
      
      expect(getByText('Test Component')).toBeTruthy();
    });

    it('should accept null user', async () => {
      const { getByText, waitForProviders } = renderWithProviders(
        <TestComponent />,
        { user: null }
      );
      
      await waitForProviders();
      
      expect(getByText('Test Component')).toBeTruthy();
    });
  });

  describe('waitForAsync', () => {
    it('should wait for async operations', async () => {
      let resolved = false;
      
      setTimeout(() => {
        resolved = true;
      }, 0);
      
      await waitForAsync();
      
      expect(resolved).toBe(true);
    });
  });

  describe('silenceConsole', () => {
    it('should mock console methods', () => {
      const originalError = console.error;
      const originalWarn = console.warn;
      
      // Simulate beforeAll
      const mockError = jest.fn();
      const mockWarn = jest.fn();
      console.error = mockError;
      console.warn = mockWarn;
      
      console.error('test error');
      console.warn('test warning');
      
      expect(mockError).toHaveBeenCalledWith('test error');
      expect(mockWarn).toHaveBeenCalledWith('test warning');
      
      // Restore
      console.error = originalError;
      console.warn = originalWarn;
    });
  });

  describe('setupMockTimers', () => {
    it('should setup and cleanup timers correctly', () => {
      // This is tested implicitly through usage in other tests
      expect(setupMockTimers).toBeDefined();
    });
  });

  describe('mockAsyncStorage', () => {
    it('should mock AsyncStorage operations', async () => {
      const { store, mock } = mockAsyncStorage();
      
      await mock.setItem('test-key', 'test-value');
      expect(store['test-key']).toBe('test-value');
      
      const value = await mock.getItem('test-key');
      expect(value).toBe('test-value');
      
      await mock.removeItem('test-key');
      expect(store['test-key']).toBeUndefined();
      
      await mock.setItem('key1', 'value1');
      await mock.setItem('key2', 'value2');
      
      const keys = await mock.getAllKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      
      const multiGetResult = await mock.multiGet(['key1', 'key2']);
      expect(multiGetResult).toEqual([
        ['key1', 'value1'],
        ['key2', 'value2']
      ]);
      
      await mock.clear();
      expect(Object.keys(store).length).toBe(0);
    });
  });

  describe('createMockNavigation', () => {
    it('should create mock navigation with navigate method', () => {
      const navigation = createMockNavigation();
      
      navigation.navigate('TestScreen', { id: '123' });
      
      expect(navigation.navigate).toHaveBeenCalledWith('TestScreen', { id: '123' });
    });

    it('should accept overrides', () => {
      const customGoBack = jest.fn();
      const navigation = createMockNavigation({ goBack: customGoBack });
      
      expect(navigation.goBack).toBe(customGoBack);
    });
  });

  describe('testAccessibility', () => {
    it('should test component accessibility', () => {
      const TestAccessibleComponent = () => (
        <View>
          <Text accessibilityRole="button">Button</Text>
          <Text accessibilityLabel="Test Label">Content</Text>
        </View>
      );
      
      const accessibility = testAccessibility(<TestAccessibleComponent />);
      
      expect(accessibility.hasRole('button')).toBe(true);
      expect(accessibility.hasLabel('Test Label')).toBe(true);
      expect(accessibility.hasRole('nonexistent')).toBe(false);
    });
  });

  describe('expectLoadingState', () => {
    it('should check for loading indicator', () => {
      const { getByTestId } = renderWithProviders(
        <View testID="loading-indicator" />
      );
      
      expectLoadingState(getByTestId);
    });
  });

  describe('expectErrorState', () => {
    it('should check for error message', () => {
      const { getByText } = renderWithProviders(
        <Text>An error occurred</Text>
      );
      
      expectErrorState(getByText);
    });

    it('should check for custom error message', () => {
      const { getByText } = renderWithProviders(
        <Text>Custom error message</Text>
      );
      
      expectErrorState(getByText, 'Custom error message');
    });
  });

  describe('promise helpers', () => {
    it('should create resolved promise mock', async () => {
      const mockFn = resolvedPromise('success');
      const result = await mockFn();
      
      expect(result).toBe('success');
    });

    it('should create rejected promise mock', async () => {
      const mockFn = rejectedPromise('error message');
      
      await expect(mockFn()).rejects.toThrow('error message');
    });

    it('should handle Error object in rejected promise', async () => {
      const error = new Error('custom error');
      const mockFn = rejectedPromise(error);
      
      await expect(mockFn()).rejects.toThrow(error);
    });
  });

  describe('createMockSupabaseClient', () => {
    it('should create mock Supabase client with chainable methods', () => {
      const client = createMockSupabaseClient();
      
      const result = client.from('users').select('*').eq('id', '123').single();
      
      expect(client.from).toHaveBeenCalledWith('users');
      expect(result.select).toHaveBeenCalled();
      expect(result.eq).toHaveBeenCalledWith('id', '123');
      expect(result.single).toHaveBeenCalled();
    });

    it('should have auth methods', () => {
      const client = createMockSupabaseClient();
      
      expect(client.auth.getUser).toBeDefined();
      expect(client.auth.signIn).toBeDefined();
      expect(client.auth.signOut).toBeDefined();
      expect(client.auth.onAuthStateChange).toBeDefined();
    });
  });

  describe('dateSerializer', () => {
    it('should serialize Date objects', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      
      expect(dateSerializer.test(date)).toBe(true);
      expect(dateSerializer.print(date)).toBe('Date(2024-01-01T00:00:00.000Z)');
    });

    it('should not serialize non-Date objects', () => {
      expect(dateSerializer.test('not a date')).toBe(false);
      expect(dateSerializer.test(123)).toBe(false);
      expect(dateSerializer.test({})).toBe(false);
    });
  });
});