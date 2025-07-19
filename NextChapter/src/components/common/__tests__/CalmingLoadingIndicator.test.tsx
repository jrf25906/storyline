import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CalmingLoadingIndicator } from '@components/common/CalmingLoadingIndicator';
import { ThemeProvider } from '@context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('CalmingLoadingIndicator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with default props', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <CalmingLoadingIndicator />
    );

    expect(getByTestId('calming-loading-indicator')).toBeTruthy();
    expect(getByText('Taking a moment...')).toBeTruthy();
  });

  it('should render with custom message', () => {
    const { getByText } = renderWithTheme(
      <CalmingLoadingIndicator message="Saving your progress..." />
    );

    expect(getByText('Saving your progress...')).toBeTruthy();
  });

  it('should show tip after delay', async () => {
    const { queryByText, getByText } = renderWithTheme(
      <CalmingLoadingIndicator showTip={true} />
    );

    // Tip should not be visible initially
    expect(queryByText(/Did you know/)).toBeNull();

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(getByText(/Did you know/)).toBeTruthy();
    });
  });

  it('should render full screen overlay', () => {
    const { getByTestId } = renderWithTheme(
      <CalmingLoadingIndicator fullScreen={true} />
    );

    const container = getByTestId('calming-loading-indicator');
    expect(container.props.style).toMatchObject(
      expect.objectContaining({
        position: 'absolute',
      })
    );
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    const { getByTestId } = renderWithTheme(
      <CalmingLoadingIndicator style={customStyle} />
    );

    const container = getByTestId('calming-loading-indicator');
    expect(container.props.style).toMatchObject(
      expect.objectContaining(customStyle)
    );
  });

  it('should have proper accessibility attributes', () => {
    const { getByTestId } = renderWithTheme(
      <CalmingLoadingIndicator message="Loading your data..." />
    );

    const container = getByTestId('calming-loading-indicator');
    expect(container.props.accessible).toBe(true);
    expect(container.props.accessibilityRole).toBe('progressbar');
    expect(container.props.accessibilityLabel).toBe('Loading your data...');
    expect(container.props.accessibilityState).toEqual({ busy: true });
  });

  it('should animate breathing effect', async () => {
    const { getByTestId } = renderWithTheme(
      <CalmingLoadingIndicator />
    );

    const animatedView = getByTestId('breathing-animation');
    expect(animatedView).toBeTruthy();
    
    // Verify animation is set up (actual animation testing would require more complex mocking)
    expect(animatedView.props.style).toBeDefined();
  });

  it('should cycle through multiple messages', async () => {
    const messages = ['Step 1...', 'Step 2...', 'Step 3...'];
    const { getByText } = renderWithTheme(
      <CalmingLoadingIndicator messages={messages} />
    );

    expect(getByText('Step 1...')).toBeTruthy();

    // Advance to next message
    jest.advanceTimersByTime(4000);
    await waitFor(() => {
      expect(getByText('Step 2...')).toBeTruthy();
    });

    // Advance to next message
    jest.advanceTimersByTime(4000);
    await waitFor(() => {
      expect(getByText('Step 3...')).toBeTruthy();
    });
  });
});