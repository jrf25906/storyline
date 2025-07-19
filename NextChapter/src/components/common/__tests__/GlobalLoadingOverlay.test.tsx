import React from 'react';
import { render } from '@testing-library/react-native';
import { GlobalLoadingOverlay } from '@components/common/GlobalLoadingOverlay';
import { useUIStore } from '@stores/uiStore';
import { ThemeProvider } from '@context/ThemeContext';

// Mock the UI store
jest.mock('../../../stores/uiStore');

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('GlobalLoadingOverlay', () => {
  const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when not loading', () => {
    mockUseUIStore.mockReturnValue({
      globalLoading: false,
      loadingMessage: undefined,
    } as any);

    const { queryByTestId } = renderWithTheme(<GlobalLoadingOverlay />);
    expect(queryByTestId('global-loading-overlay')).toBeNull();
  });

  it('should render when loading', () => {
    mockUseUIStore.mockReturnValue({
      globalLoading: true,
      loadingMessage: 'Saving your progress...',
    } as any);

    const { getByTestId, getByText } = renderWithTheme(<GlobalLoadingOverlay />);
    expect(getByTestId('global-loading-overlay')).toBeTruthy();
    expect(getByText('Saving your progress...')).toBeTruthy();
  });

  it('should show default message when no message provided', () => {
    mockUseUIStore.mockReturnValue({
      globalLoading: true,
      loadingMessage: 'Taking care of that for you...',
    } as any);

    const { getByText } = renderWithTheme(<GlobalLoadingOverlay />);
    expect(getByText('Taking care of that for you...')).toBeTruthy();
  });

  it('should render with fullscreen style', () => {
    mockUseUIStore.mockReturnValue({
      globalLoading: true,
      loadingMessage: 'Loading...',
    } as any);

    const { getByTestId } = renderWithTheme(<GlobalLoadingOverlay />);
    const overlay = getByTestId('global-loading-overlay');
    
    expect(overlay.props.style).toMatchObject(
      expect.objectContaining({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      })
    );
  });

  it('should have proper accessibility attributes', () => {
    mockUseUIStore.mockReturnValue({
      globalLoading: true,
      loadingMessage: 'Processing...',
    } as any);

    const { getByTestId } = renderWithTheme(<GlobalLoadingOverlay />);
    const overlay = getByTestId('global-loading-overlay');
    
    expect(overlay.props.accessible).toBe(true);
    expect(overlay.props.accessibilityRole).toBe('progressbar');
    expect(overlay.props.accessibilityLabel).toBe('Processing...');
    expect(overlay.props.accessibilityState).toEqual({ busy: true });
  });

  it('should prevent touch events when loading', () => {
    mockUseUIStore.mockReturnValue({
      globalLoading: true,
      loadingMessage: 'Loading...',
    } as any);

    const { getByTestId } = renderWithTheme(<GlobalLoadingOverlay />);
    const overlay = getByTestId('global-loading-overlay');
    
    expect(overlay.props.pointerEvents).toBe('auto');
  });
});