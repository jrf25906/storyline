import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { ThemeProvider } from '@context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ErrorMessage', () => {
  it('renders error message correctly', () => {
    const { getByText } = renderWithTheme(
      <ErrorMessage message="Something went wrong" />
    );

    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders with different types', () => {
    const { getByText, rerender } = renderWithTheme(
      <ErrorMessage message="Error message" type="error" />
    );
    expect(getByText('💙')).toBeTruthy(); // Error icon

    rerender(
      <ThemeProvider>
        <ErrorMessage message="Warning message" type="warning" />
      </ThemeProvider>
    );
    expect(getByText('⚠️')).toBeTruthy(); // Warning icon

    rerender(
      <ThemeProvider>
        <ErrorMessage message="Info message" type="info" />
      </ThemeProvider>
    );
    expect(getByText('ℹ️')).toBeTruthy(); // Info icon
  });

  it('calls onDismiss when dismiss button is pressed', () => {
    const onDismiss = jest.fn();
    const { getByText } = renderWithTheme(
      <ErrorMessage message="Test error" onDismiss={onDismiss} />
    );

    fireEvent.press(getByText('✕'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    const { queryByText } = renderWithTheme(
      <ErrorMessage message="Test error" />
    );

    expect(queryByText('✕')).toBeNull();
  });

  it('auto hides after delay when autoHide is true', async () => {
    const onDismiss = jest.fn();
    renderWithTheme(
      <ErrorMessage 
        message="Auto hide error" 
        autoHide={true}
        autoHideDelay={100}
        onDismiss={onDismiss}
      />
    );

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });

  it('has proper accessibility attributes', () => {
    const { getByRole, getByLabelText } = renderWithTheme(
      <ErrorMessage message="Test error" type="error" onDismiss={jest.fn()} />
    );

    expect(getByRole('alert')).toBeTruthy();
    expect(getByLabelText('error message')).toBeTruthy();
    expect(getByLabelText('Dismiss message')).toBeTruthy();
  });

  it('uses testID when provided', () => {
    const { getByTestId } = renderWithTheme(
      <ErrorMessage message="Test error" testID="custom-error" />
    );

    expect(getByTestId('custom-error')).toBeTruthy();
  });
});