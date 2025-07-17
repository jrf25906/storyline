import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingIndicator from '../LoadingIndicator';
import { ThemeProvider } from '../../../context/ThemeContext';
import { Colors } from '../../../theme';

// Mock ThemeContext
const mockTheme = {
  colors: {
    primary: '#00AE5F',
    background: '#FFFFFF',
  },
};

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('LoadingIndicator', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  it('should render with default props', () => {
    const { getByTestId, getByLabelText } = renderWithTheme(
      <LoadingIndicator testID="loading-indicator" />
    );

    const container = getByTestId('loading-indicator');
    expect(container).toBeTruthy();
    
    // Check accessibility
    expect(container.props.accessible).toBe(true);
    expect(container.props.accessibilityRole).toBe('progressbar');
    expect(container.props.accessibilityLabel).toBe('Loading');
    expect(container.props.accessibilityState).toEqual({ busy: true });
  });

  it('should render with custom message', () => {
    const message = 'Loading your data...';
    const { getByText, getByTestId } = renderWithTheme(
      <LoadingIndicator message={message} testID="loading-indicator" />
    );

    const messageText = getByText(message);
    expect(messageText).toBeTruthy();
    
    // Check accessibility label updates with message
    const container = getByTestId('loading-indicator');
    expect(container.props.accessibilityLabel).toBe(message);
  });

  it('should apply custom color', () => {
    const customColor = '#FF0000';
    const { UNSAFE_getByType } = renderWithTheme(
      <LoadingIndicator color={customColor} />
    );

    const activityIndicator = UNSAFE_getByType('ActivityIndicator' as any);
    expect(activityIndicator.props.color).toBe(customColor);
  });

  it('should render with small size', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <LoadingIndicator size="small" />
    );

    const activityIndicator = UNSAFE_getByType('ActivityIndicator' as any);
    expect(activityIndicator.props.size).toBe('small');
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'red', padding: 20 };
    const { getByTestId } = renderWithTheme(
      <LoadingIndicator style={customStyle} testID="loading-indicator" />
    );

    const container = getByTestId('loading-indicator');
    expect(container.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining(customStyle)
    ]));
  });

  it('should use theme colors in dark mode', () => {
    const useThemeMock = require('../../../context/ThemeContext').useTheme;
    useThemeMock.mockReturnValue({
      theme: {
        colors: {
          primary: '#00AE5F',
          background: '#1A1F1B', // Colors.dark.background
        },
      },
      isDark: true,
    });

    const { getByText } = renderWithTheme(
      <LoadingIndicator message="Loading..." />
    );

    const messageText = getByText('Loading...');
    const styles = messageText.props.style;
    
    // Check that dark mode text color is applied
    expect(styles).toEqual(expect.arrayContaining([
      expect.objectContaining({ color: '#B3BDB6' }) // Colors.dark.textSecondary
    ]));
  });

  it('should have proper accessibility for screen readers', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <LoadingIndicator />
    );

    const activityIndicator = UNSAFE_getByType('ActivityIndicator' as any);
    expect(activityIndicator.props.accessibilityLabel).toBe('Loading indicator');
  });
});