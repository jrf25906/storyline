import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingOverlay } from '../LoadingOverlay';
import { ThemeProvider } from '../../../context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('LoadingOverlay', () => {
  it('renders nothing when visible is false', () => {
    const { queryByLabelText } = renderWithTheme(
      <LoadingOverlay visible={false} />
    );

    expect(queryByLabelText('Loading')).toBeNull();
  });

  it('renders loading indicator when visible is true', () => {
    const { getByLabelText } = renderWithTheme(
      <LoadingOverlay visible={true} />
    );

    expect(getByLabelText('Loading')).toBeTruthy();
  });

  it('renders message when provided', () => {
    const { getByText } = renderWithTheme(
      <LoadingOverlay visible={true} message="Loading your data..." />
    );

    expect(getByText('Loading your data...')).toBeTruthy();
  });

  it('renders as overlay when fullScreen is false', () => {
    const { queryByTestId } = renderWithTheme(
      <LoadingOverlay visible={true} fullScreen={false} />
    );

    // Should not render in a modal
    expect(queryByTestId('modal')).toBeNull();
  });

  it('has proper accessibility label when message is provided', () => {
    const { getByLabelText } = renderWithTheme(
      <LoadingOverlay visible={true} message="Signing you in..." fullScreen={true} />
    );

    expect(getByLabelText('Signing you in...')).toBeTruthy();
  });

  it('has default accessibility label when no message', () => {
    const { getByLabelText } = renderWithTheme(
      <LoadingOverlay visible={true} fullScreen={true} />
    );

    expect(getByLabelText('Loading, please wait')).toBeTruthy();
  });
});