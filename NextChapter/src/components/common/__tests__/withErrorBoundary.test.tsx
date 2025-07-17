import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { withErrorBoundary } from '../withErrorBoundary';
import { ThemeProvider } from '../../../context/ThemeContext';

// Helper to wrap components with ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

// Test component that can throw errors
const TestComponent: React.FC<{ shouldThrow?: boolean; testID?: string }> = ({ 
  shouldThrow = false, 
  testID = 'test-component' 
}) => {
  if (shouldThrow) {
    throw new Error('Test error from component');
  }
  return (
    <View testID={testID}>
      <Text>Component content</Text>
    </View>
  );
};

describe('withErrorBoundary HOC', () => {
  // Suppress console errors for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render the wrapped component when there is no error', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    const { getByText, getByTestId } = renderWithTheme(<WrappedComponent />);

    expect(getByText('Component content')).toBeTruthy();
    expect(getByTestId('test-component')).toBeTruthy();
  });

  it('should pass props to the wrapped component', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    const { getByTestId } = renderWithTheme(<WrappedComponent testID="custom-id" />);

    expect(getByTestId('custom-id')).toBeTruthy();
  });

  it('should display error UI when wrapped component throws', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    const { getByText } = renderWithTheme(<WrappedComponent shouldThrow={true} />);

    expect(getByText('Oops, something unexpected happened')).toBeTruthy();
    expect(getByText("We're working on it. Please try again in a moment.")).toBeTruthy();
  });

  it('should use custom error message when provided', () => {
    const customMessage = {
      title: 'Custom Error Title',
      message: 'Custom error message for users'
    };
    const WrappedComponent = withErrorBoundary(TestComponent, { errorMessage: customMessage });
    const { getByText } = renderWithTheme(<WrappedComponent shouldThrow={true} />);

    expect(getByText(customMessage.title)).toBeTruthy();
    expect(getByText(customMessage.message)).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    const WrappedComponent = withErrorBoundary(TestComponent, { onError });
    
    renderWithTheme(<WrappedComponent shouldThrow={true} />);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error from component' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('should reset error state when Try Again is pressed', () => {
    let shouldThrow = true;
    const TestComponentWithToggle = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <Text>No error</Text>;
    };

    const WrappedComponent = withErrorBoundary(TestComponentWithToggle);
    const { getByText, queryByText, getByLabelText } = renderWithTheme(<WrappedComponent />);

    expect(getByText('Oops, something unexpected happened')).toBeTruthy();

    // Set it so component won't throw
    shouldThrow = false;

    // Press Try Again
    fireEvent.press(getByLabelText('Try again'));

    // Error UI should be gone and normal content should show
    expect(queryByText('Oops, something unexpected happened')).toBeNull();
    expect(getByText('No error')).toBeTruthy();
  });

  it('should have proper accessibility attributes on error UI', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);
    const { getByRole, getByLabelText } = renderWithTheme(<WrappedComponent shouldThrow={true} />);

    const tryAgainButton = getByRole('button');
    expect(tryAgainButton).toBeTruthy();
    expect(getByLabelText('Try again')).toBeTruthy();
  });

  it('should preserve component display name', () => {
    const NamedComponent: React.FC = () => <Text>Named</Text>;
    NamedComponent.displayName = 'CustomComponentName';
    
    const WrappedComponent = withErrorBoundary(NamedComponent);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(CustomComponentName)');
  });

  it('should handle components without display name', () => {
    const AnonymousComponent = () => <Text>Anonymous</Text>;
    const WrappedComponent = withErrorBoundary(AnonymousComponent);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(AnonymousComponent)');
  });

  it('should provide custom fallback UI when specified', () => {
    const customFallback = (
      <View testID="custom-error-ui">
        <Text>Custom Error UI</Text>
      </View>
    );
    
    const WrappedComponent = withErrorBoundary(TestComponent, { 
      fallback: customFallback 
    });
    
    const { getByTestId, getByText } = renderWithTheme(<WrappedComponent shouldThrow={true} />);

    expect(getByTestId('custom-error-ui')).toBeTruthy();
    expect(getByText('Custom Error UI')).toBeTruthy();
  });
});