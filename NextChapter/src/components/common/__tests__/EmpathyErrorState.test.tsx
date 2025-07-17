import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { EmpathyErrorState } from '../EmpathyErrorState';
import { ThemeProvider } from '../../../context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('EmpathyErrorState', () => {
  const defaultProps = {
    title: "We hit a small bump",
    message: "Don't worry, we can fix this together.",
  };

  it('should render with required props', () => {
    const { getByText } = renderWithTheme(
      <EmpathyErrorState {...defaultProps} />
    );

    expect(getByText(defaultProps.title)).toBeTruthy();
    expect(getByText(defaultProps.message)).toBeTruthy();
  });

  it('should show recovery action button when provided', () => {
    const onRetry = jest.fn();
    const { getByText } = renderWithTheme(
      <EmpathyErrorState
        {...defaultProps}
        recoveryAction={onRetry}
        recoveryLabel="Try Again"
      />
    );

    const button = getByText('Try Again');
    expect(button).toBeTruthy();
    
    fireEvent.press(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should show details in development mode', () => {
    const originalDev = __DEV__;
    Object.defineProperty(global, '__DEV__', {
      value: true,
      writable: true,
    });

    const { getByText } = renderWithTheme(
      <EmpathyErrorState
        {...defaultProps}
        details="Error: Network timeout"
      />
    );

    expect(getByText('Error: Network timeout')).toBeTruthy();

    Object.defineProperty(global, '__DEV__', {
      value: originalDev,
      writable: true,
    });
  });

  it('should hide details in production mode', () => {
    const originalDev = __DEV__;
    Object.defineProperty(global, '__DEV__', {
      value: false,
      writable: true,
    });

    const { queryByText } = renderWithTheme(
      <EmpathyErrorState
        {...defaultProps}
        details="Error: Network timeout"
      />
    );

    expect(queryByText('Error: Network timeout')).toBeNull();

    Object.defineProperty(global, '__DEV__', {
      value: originalDev,
      writable: true,
    });
  });

  it('should use appropriate icon based on type', () => {
    const { getByText, rerender } = renderWithTheme(
      <EmpathyErrorState {...defaultProps} type="error" />
    );

    expect(getByText('💙')).toBeTruthy(); // Heart for error

    rerender(
      <ThemeProvider>
        <EmpathyErrorState {...defaultProps} type="warning" />
      </ThemeProvider>
    );
    expect(getByText('🌟')).toBeTruthy(); // Star for warning

    rerender(
      <ThemeProvider>
        <EmpathyErrorState {...defaultProps} type="info" />
      </ThemeProvider>
    );
    expect(getByText('💡')).toBeTruthy(); // Lightbulb for info
  });

  it('should show contact support link', () => {
    const onContactSupport = jest.fn();
    const { getByText } = renderWithTheme(
      <EmpathyErrorState
        {...defaultProps}
        showSupportLink={true}
        onContactSupport={onContactSupport}
      />
    );

    const link = getByText('Need help? We\'re here for you');
    expect(link).toBeTruthy();
    
    fireEvent.press(link);
    expect(onContactSupport).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    const { getByTestId } = renderWithTheme(
      <EmpathyErrorState {...defaultProps} />
    );

    const container = getByTestId('empathy-error-state');
    expect(container.props.accessible).toBe(true);
    expect(container.props.accessibilityRole).toBe('alert');
    expect(container.props.accessibilityLabel).toContain(defaultProps.title);
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = renderWithTheme(
      <EmpathyErrorState {...defaultProps} style={customStyle} />
    );

    const container = getByTestId('empathy-error-state');
    expect(container.props.style).toMatchObject(
      expect.objectContaining(customStyle)
    );
  });

  it('should render full screen mode', () => {
    const { getByTestId } = renderWithTheme(
      <EmpathyErrorState {...defaultProps} fullScreen={true} />
    );

    const container = getByTestId('empathy-error-state');
    expect(container.props.style).toMatchObject(
      expect.objectContaining({
        flex: 1,
      })
    );
  });

  it('should show progressive disclosure button for details', () => {
    const { getByText, queryByText } = renderWithTheme(
      <EmpathyErrorState
        {...defaultProps}
        details="Technical error details here"
        showProgressiveDisclosure={true}
      />
    );

    // Details should be hidden initially
    expect(queryByText('Technical error details here')).toBeNull();

    // Click to show details
    const showDetailsButton = getByText('Show details');
    fireEvent.press(showDetailsButton);

    expect(getByText('Technical error details here')).toBeTruthy();
    expect(getByText('Hide details')).toBeTruthy();
  });

  it('should have minimum touch target size', () => {
    const onRetry = jest.fn();
    const { getByText } = renderWithTheme(
      <EmpathyErrorState
        {...defaultProps}
        recoveryAction={onRetry}
        recoveryLabel="Try Again"
      />
    );

    const button = getByText('Try Again').parent;
    const style = StyleSheet.flatten(button?.props.style);
    
    // Check minimum height for touch target
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });
});