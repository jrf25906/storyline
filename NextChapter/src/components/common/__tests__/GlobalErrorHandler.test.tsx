import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlobalErrorHandler } from '../GlobalErrorHandler';
import { useUIStore } from '../../../stores/uiStore';
import { ThemeProvider } from '../../../context/ThemeContext';

// Mock the UI store
jest.mock('../../../stores/uiStore');

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('GlobalErrorHandler', () => {
  const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;
  const mockClearGlobalError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockClearGlobalError.mockClear();
  });

  it('should not render when no global error', () => {
    mockUseUIStore.mockReturnValue({
      globalError: null,
      clearGlobalError: mockClearGlobalError,
    } as any);

    const { queryByTestId } = renderWithTheme(<GlobalErrorHandler />);
    expect(queryByTestId('global-error-handler')).toBeNull();
  });

  it('should render error state when global error exists', () => {
    const error = new Error('Test error');
    mockUseUIStore.mockReturnValue({
      globalError: {
        error,
        message: 'Something went wrong',
        type: 'error',
      },
      clearGlobalError: mockClearGlobalError,
    } as any);

    const { getByText, getByTestId } = renderWithTheme(<GlobalErrorHandler />);
    expect(getByTestId('global-error-handler')).toBeTruthy();
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('should show recovery action when provided', () => {
    const recoveryAction = jest.fn();
    mockUseUIStore.mockReturnValue({
      globalError: {
        error: new Error('Test error'),
        message: 'Network error occurred',
        type: 'error',
        recoveryAction,
      },
      clearGlobalError: mockClearGlobalError,
    } as any);

    const { getByText } = renderWithTheme(<GlobalErrorHandler />);
    const retryButton = getByText('Try Again');
    
    fireEvent.press(retryButton);
    expect(recoveryAction).toHaveBeenCalledTimes(1);
    expect(mockClearGlobalError).toHaveBeenCalledTimes(1);
  });

  it('should handle dismiss action', () => {
    mockUseUIStore.mockReturnValue({
      globalError: {
        error: new Error('Test error'),
        message: 'An error occurred',
        type: 'error',
      },
      clearGlobalError: mockClearGlobalError,
    } as any);

    const { getByText } = renderWithTheme(<GlobalErrorHandler />);
    const dismissButton = getByText('Dismiss');
    
    fireEvent.press(dismissButton);
    expect(mockClearGlobalError).toHaveBeenCalledTimes(1);
  });

  it('should render different error types correctly', () => {
    // Test warning type
    mockUseUIStore.mockReturnValue({
      globalError: {
        error: new Error('Warning'),
        message: 'This is a warning',
        type: 'warning',
      },
      clearGlobalError: mockClearGlobalError,
    } as any);

    const { getByText, rerender } = renderWithTheme(<GlobalErrorHandler />);
    expect(getByText('Heads up')).toBeTruthy();
    expect(getByText('This is a warning')).toBeTruthy();

    // Test info type
    mockUseUIStore.mockReturnValue({
      globalError: {
        error: new Error('Info'),
        message: 'This is information',
        type: 'info',
      },
      clearGlobalError: mockClearGlobalError,
    } as any);

    rerender(
      <ThemeProvider>
        <GlobalErrorHandler />
      </ThemeProvider>
    );
    
    expect(getByText('Just so you know')).toBeTruthy();
    expect(getByText('This is information')).toBeTruthy();
  });

  it('should use empathetic titles based on error type', () => {
    mockUseUIStore.mockReturnValue({
      globalError: {
        error: new Error('Test'),
        message: 'Error message',
        type: 'error',
      },
      clearGlobalError: mockClearGlobalError,
    } as any);

    const { getByText } = renderWithTheme(<GlobalErrorHandler />);
    expect(getByText('We hit a small bump')).toBeTruthy();
  });

  it('should render as modal overlay', () => {
    mockUseUIStore.mockReturnValue({
      globalError: {
        error: new Error('Test error'),
        message: 'Error message',
        type: 'error',
      },
      clearGlobalError: mockClearGlobalError,
    } as any);

    const { getByTestId } = renderWithTheme(<GlobalErrorHandler />);
    const overlay = getByTestId('global-error-handler');
    
    expect(overlay.props.style).toMatchObject(
      expect.objectContaining({
        position: 'absolute',
      })
    );
  });
});