import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { 
  renderWithProviders,
  createMockUIStore,
  createMockAnalyticsService,
  buildUser,
} from '@test-utils';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import { GlobalErrorHandler } from '@components/common/GlobalErrorHandler';
import { EmpathyErrorState } from '@components/common/EmpathyErrorState';

// Mock the stores
jest.mock('../../stores', () => ({
  useUIStore: jest.fn(),
}));

// Mock the service container
jest.mock('../../services/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(),
  },
}));

describe('Error Handling Integration', () => {
  let mockUIStore: ReturnType<typeof createMockUIStore>;
  let mockAnalytics: ReturnType<typeof createMockAnalyticsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockUIStore = createMockUIStore();
    mockAnalytics = createMockAnalyticsService();
    
    const { useUIStore } = require('@stores');
    useUIStore.mockReturnValue(mockUIStore);
    
    const { ServiceContainer } = require('@services/ServiceContainer');
    ServiceContainer.getInstance.mockReturnValue({
      analytics: mockAnalytics,
    });
  });

  describe('Component Error Boundaries', () => {
    const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Component crashed!');
      }
      return <Text>Working component</Text>;
    };

    const WrappedComponent = withErrorBoundary(ThrowingComponent);

    it('should catch and display empathetic error messages', () => {
      const { getByText } = renderWithProviders(
        <WrappedComponent shouldThrow={true} />
      );

      expect(getByText('Oops, something unexpected happened')).toBeTruthy();
      expect(getByText(/We're working on it/)).toBeTruthy();
    });

    it('should track errors in analytics', () => {
      renderWithProviders(<WrappedComponent shouldThrow={true} />);

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'error_boundary_triggered',
        expect.objectContaining({
          error: 'Component crashed!',
          component: 'ThrowingComponent',
        })
      );
    });

    it('should allow recovery through Try Again button', async () => {
      let shouldThrow = true;
      const DynamicComponent = () => {
        if (shouldThrow) throw new Error('Temporary error');
        return <Text>Recovered!</Text>;
      };

      const WrappedDynamic = withErrorBoundary(DynamicComponent);
      const { getByLabelText, getByText, queryByText } = renderWithProviders(
        <WrappedDynamic />
      );

      expect(getByText(/something unexpected happened/)).toBeTruthy();

      // Fix the error condition
      shouldThrow = false;

      // Press Try Again
      fireEvent.press(getByLabelText('Try again'));

      await waitFor(() => {
        expect(queryByText(/something unexpected happened/)).toBeNull();
        expect(getByText('Recovered!')).toBeTruthy();
      });
    });
  });

  describe('Global Error Handler', () => {
    it('should display global errors from UIStore', () => {
      mockUIStore.error = 'Network connection lost';

      const { getByText } = renderWithProviders(
        <GlobalErrorHandler />
      );

      expect(getByText('Network connection lost')).toBeTruthy();
    });

    it('should allow dismissing global errors', () => {
      mockUIStore.error = 'Temporary error';

      const { getByLabelText } = renderWithProviders(
        <GlobalErrorHandler />
      );

      fireEvent.press(getByLabelText('Dismiss error'));

      expect(mockUIStore.clearError).toHaveBeenCalled();
    });

    it('should not render when no error exists', () => {
      mockUIStore.error = null;

      const { queryByTestId } = renderWithProviders(
        <GlobalErrorHandler />
      );

      expect(queryByTestId('global-error-handler')).toBeNull();
    });
  });

  describe('EmpathyErrorState Component', () => {
    it('should render empathetic messages', () => {
      const { getByText } = renderWithProviders(
        <EmpathyErrorState 
          title="Unable to load your tasks"
          message="This is temporary - your progress is safe."
        />
      );

      expect(getByText('Unable to load your tasks')).toBeTruthy();
      expect(getByText('This is temporary - your progress is safe.')).toBeTruthy();
    });

    it('should show retry button when onRetry provided', () => {
      const onRetry = jest.fn();
      
      const { getByText } = renderWithProviders(
        <EmpathyErrorState 
          title="Connection issue"
          message="Let's try that again"
          onRetry={onRetry}
        />
      );

      const retryButton = getByText('Try Again');
      fireEvent.press(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });

    it('should show contact support for persistent errors', () => {
      const { getByText } = renderWithProviders(
        <EmpathyErrorState 
          title="Something went wrong"
          message="We're here to help"
          showSupport={true}
        />
      );

      expect(getByText(/Contact Support/)).toBeTruthy();
    });

    it('should have proper accessibility', () => {
      const { getByRole, getByLabelText } = renderWithProviders(
        <EmpathyErrorState 
          title="Error"
          message="Please try again"
          onRetry={jest.fn()}
        />
      );

      expect(getByRole('alert')).toBeTruthy();
      expect(getByLabelText(/error state/i)).toBeTruthy();
    });
  });

  describe('Error Recovery Flows', () => {
    it('should handle network errors gracefully', async () => {
      const NetworkComponent = () => {
        const [data, setData] = React.useState<string | null>(null);
        const [error, setError] = React.useState<string | null>(null);

        const fetchData = async () => {
          try {
            throw new Error('Network request failed');
          } catch (e) {
            setError('Unable to connect. Please check your internet.');
          }
        };

        return (
          <>
            {error ? (
              <EmpathyErrorState 
                title="Connection Issue"
                message={error}
                onRetry={() => {
                  setError(null);
                  setData('Recovered data');
                }}
              />
            ) : (
              <>
                <Text>{data || 'No data'}</Text>
                <TouchableOpacity onPress={fetchData}>
                  <Text>Fetch Data</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        );
      };

      const { getByText, queryByText } = renderWithProviders(<NetworkComponent />);

      // Trigger network error
      fireEvent.press(getByText('Fetch Data'));

      await waitFor(() => {
        expect(getByText('Connection Issue')).toBeTruthy();
        expect(getByText(/check your internet/)).toBeTruthy();
      });

      // Retry
      fireEvent.press(getByText('Try Again'));

      await waitFor(() => {
        expect(queryByText('Connection Issue')).toBeNull();
        expect(getByText('Recovered data')).toBeTruthy();
      });
    });

    it('should handle auth errors with appropriate messaging', () => {
      const AuthErrorComponent = () => {
        throw new Error('AUTH_ERROR: Session expired');
      };

      const WrappedAuth = withErrorBoundary(AuthErrorComponent, {
        errorMessage: {
          title: 'Session Expired',
          message: 'Please sign in again to continue.',
        },
      });

      const { getByText } = renderWithProviders(<WrappedAuth />);

      expect(getByText('Session Expired')).toBeTruthy();
      expect(getByText(/sign in again/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should announce errors to screen readers', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      const Wrapped = withErrorBoundary(ErrorComponent);
      const { getByRole } = renderWithProviders(<Wrapped />);

      const errorAlert = getByRole('alert');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert.props.accessibilityLiveRegion).toBe('assertive');
    });

    it('should have proper focus management', () => {
      const { getByLabelText } = renderWithProviders(
        <EmpathyErrorState 
          title="Error"
          message="Test"
          onRetry={jest.fn()}
        />
      );

      const retryButton = getByLabelText('Try again');
      expect(retryButton.props.accessibilityRole).toBe('button');
      expect(retryButton.props.accessibilityState?.disabled).toBeFalsy();
    });
  });

  describe('Error Logging', () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
      console.error = jest.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('should log errors to console in development', () => {
      const ErrorComponent = () => {
        throw new Error('Development error');
      };

      const Wrapped = withErrorBoundary(ErrorComponent);
      renderWithProviders(<Wrapped />);

      expect(console.error).toHaveBeenCalled();
    });

    it('should include stack traces for debugging', () => {
      const onError = jest.fn();
      const ErrorComponent = () => {
        throw new Error('Stack trace test');
      };

      const Wrapped = withErrorBoundary(ErrorComponent, { onError });
      renderWithProviders(<Wrapped />);

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Stack trace test',
          stack: expect.any(String),
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });
});