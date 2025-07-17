// UI Store tests - TDD approach
import { renderHook, act } from '@testing-library/react-native';
import { useUIStore } from '../uiStore';

describe('UIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      globalLoading: false,
      globalError: null,
      loadingMessage: undefined,
      loadingStates: {},
      errors: {},
      networkStatus: 'online',
      offlineQueue: [],
    });
  });

  describe('Global Loading State', () => {
    it('should set global loading state with optional message', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setGlobalLoading(true, 'Updating your information...');
      });

      expect(result.current.globalLoading).toBe(true);
      expect(result.current.loadingMessage).toBe('Updating your information...');

      act(() => {
        result.current.setGlobalLoading(false);
      });

      expect(result.current.globalLoading).toBe(false);
      expect(result.current.loadingMessage).toBeUndefined();
    });

    it('should use calming default message when loading without message', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setGlobalLoading(true);
      });

      expect(result.current.loadingMessage).toBe('Taking care of that for you...');
    });
  });

  describe('Global Error State', () => {
    it('should set global error with empathetic message', () => {
      const { result } = renderHook(() => useUIStore());
      const error = new Error('Network error');

      act(() => {
        result.current.setGlobalError(error, 'We couldn\'t connect right now. Let\'s try again.');
      });

      expect(result.current.globalError).toEqual({
        error,
        message: 'We couldn\'t connect right now. Let\'s try again.',
        type: 'error',
        recoveryAction: undefined,
      });
    });

    it('should clear global error', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setGlobalError(new Error('Test error'));
        result.current.clearGlobalError();
      });

      expect(result.current.globalError).toBeNull();
    });

    it('should set error with recovery action', () => {
      const { result } = renderHook(() => useUIStore());
      const recoveryAction = jest.fn();

      act(() => {
        result.current.setGlobalError(
          new Error('Test error'),
          'Something went wrong',
          'warning',
          recoveryAction
        );
      });

      expect(result.current.globalError?.type).toBe('warning');
      expect(result.current.globalError?.recoveryAction).toBe(recoveryAction);
    });
  });

  describe('Feature-specific Loading States', () => {
    it('should manage loading states by feature key', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setFeatureLoading('bouncePlan', true);
        result.current.setFeatureLoading('budget', true);
      });

      expect(result.current.isFeatureLoading('bouncePlan')).toBe(true);
      expect(result.current.isFeatureLoading('budget')).toBe(true);
      expect(result.current.isFeatureLoading('coach')).toBe(false);

      act(() => {
        result.current.setFeatureLoading('bouncePlan', false);
      });

      expect(result.current.isFeatureLoading('bouncePlan')).toBe(false);
    });
  });

  describe('Feature-specific Error States', () => {
    it('should manage errors by feature key', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setFeatureError('auth', 'Your session expired. Please sign in again.');
        result.current.setFeatureError('budget', 'Budget data is temporarily unavailable.');
      });

      expect(result.current.getFeatureError('auth')).toBe('Your session expired. Please sign in again.');
      expect(result.current.getFeatureError('budget')).toBe('Budget data is temporarily unavailable.');
      expect(result.current.getFeatureError('coach')).toBeUndefined();

      act(() => {
        result.current.clearFeatureError('auth');
      });

      expect(result.current.getFeatureError('auth')).toBeUndefined();
    });
  });

  describe('Network Status', () => {
    it('should update network status', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setNetworkStatus('offline');
      });

      expect(result.current.networkStatus).toBe('offline');
      expect(result.current.isOffline()).toBe(true);

      act(() => {
        result.current.setNetworkStatus('online');
      });

      expect(result.current.networkStatus).toBe('online');
      expect(result.current.isOffline()).toBe(false);
    });

    it('should manage offline queue', () => {
      const { result } = renderHook(() => useUIStore());
      const action = { type: 'UPDATE_TASK', payload: { id: '1', completed: true } };

      act(() => {
        result.current.addToOfflineQueue(action);
      });

      expect(result.current.offlineQueue).toHaveLength(1);
      expect(result.current.offlineQueue[0]).toEqual(action);

      act(() => {
        result.current.clearOfflineQueue();
      });

      expect(result.current.offlineQueue).toHaveLength(0);
    });
  });

  describe('Error Helpers', () => {
    it('should generate empathetic error messages', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.getEmpathyErrorMessage('network')).toBe(
        'We\'re having trouble connecting. Your data is safe, and we\'ll sync when you\'re back online.'
      );

      expect(result.current.getEmpathyErrorMessage('auth')).toBe(
        'We need to verify it\'s you. Please sign in again when you\'re ready.'
      );

      expect(result.current.getEmpathyErrorMessage('unknown')).toBe(
        'Something unexpected happened. We\'re here to help - please try again or reach out to support.'
      );
    });
  });

  describe('Loading State Helpers', () => {
    it('should check if any feature is loading', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.isAnyFeatureLoading()).toBe(false);

      act(() => {
        result.current.setFeatureLoading('bouncePlan', true);
      });

      expect(result.current.isAnyFeatureLoading()).toBe(true);
    });

    it('should check if app is in any loading state', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.isLoading()).toBe(false);

      act(() => {
        result.current.setGlobalLoading(true);
      });

      expect(result.current.isLoading()).toBe(true);

      act(() => {
        result.current.setGlobalLoading(false);
        result.current.setFeatureLoading('coach', true);
      });

      expect(result.current.isLoading()).toBe(true);
    });
  });
});