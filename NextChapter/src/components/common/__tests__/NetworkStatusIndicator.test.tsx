import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { NetworkStatusIndicator } from '@components/common/NetworkStatusIndicator';
import { useUIStore } from '@stores/uiStore';
import { ThemeProvider } from '@context/ThemeContext';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('../../../stores/uiStore');
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('NetworkStatusIndicator', () => {
  const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;
  const mockSetNetworkStatus = jest.fn();
  const mockAddToOfflineQueue = jest.fn();
  let unsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    unsubscribe = jest.fn();
    
    mockUseUIStore.mockReturnValue({
      networkStatus: 'online',
      setNetworkStatus: mockSetNetworkStatus,
      addToOfflineQueue: mockAddToOfflineQueue,
      offlineQueue: [],
    } as any);

    (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribe);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not render when online', () => {
    const { queryByTestId } = renderWithTheme(<NetworkStatusIndicator />);
    expect(queryByTestId('network-status-indicator')).toBeNull();
  });

  it('should render when offline', () => {
    mockUseUIStore.mockReturnValue({
      networkStatus: 'offline',
      setNetworkStatus: mockSetNetworkStatus,
      addToOfflineQueue: mockAddToOfflineQueue,
      offlineQueue: [],
    } as any);

    const { getByTestId, getByText } = renderWithTheme(<NetworkStatusIndicator />);
    expect(getByTestId('network-status-indicator')).toBeTruthy();
    expect(getByText("You're offline")).toBeTruthy();
    expect(getByText("Don't worry, your changes are saved locally")).toBeTruthy();
  });

  it('should show slow connection warning', () => {
    mockUseUIStore.mockReturnValue({
      networkStatus: 'slow',
      setNetworkStatus: mockSetNetworkStatus,
      addToOfflineQueue: mockAddToOfflineQueue,
      offlineQueue: [],
    } as any);

    const { getByText } = renderWithTheme(<NetworkStatusIndicator />);
    expect(getByText('Slow connection')).toBeTruthy();
    expect(getByText('Things might take a bit longer')).toBeTruthy();
  });

  it('should show offline queue count', () => {
    mockUseUIStore.mockReturnValue({
      networkStatus: 'offline',
      setNetworkStatus: mockSetNetworkStatus,
      addToOfflineQueue: mockAddToOfflineQueue,
      offlineQueue: [
        { type: 'action1', payload: {} },
        { type: 'action2', payload: {} },
        { type: 'action3', payload: {} },
      ],
    } as any);

    const { getByText } = renderWithTheme(<NetworkStatusIndicator />);
    expect(getByText('3 changes waiting to sync')).toBeTruthy();
  });

  it('should setup network listener on mount', () => {
    renderWithTheme(<NetworkStatusIndicator />);
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('should cleanup network listener on unmount', () => {
    const { unmount } = renderWithTheme(<NetworkStatusIndicator />);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should update network status based on NetInfo', () => {
    renderWithTheme(<NetworkStatusIndicator />);
    
    const listener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
    
    act(() => {
      listener({ isConnected: false });
    });
    
    expect(mockSetNetworkStatus).toHaveBeenCalledWith('offline');
    
    act(() => {
      listener({ isConnected: true, isInternetReachable: true });
    });
    
    expect(mockSetNetworkStatus).toHaveBeenCalledWith('online');
  });

  it('should auto-hide after timeout', async () => {
    mockUseUIStore.mockReturnValue({
      networkStatus: 'slow',
      setNetworkStatus: mockSetNetworkStatus,
      addToOfflineQueue: mockAddToOfflineQueue,
      offlineQueue: [],
    } as any);

    const { queryByTestId } = renderWithTheme(
      <NetworkStatusIndicator autoHide={true} autoHideDelay={5000} />
    );

    expect(queryByTestId('network-status-indicator')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(queryByTestId('network-status-indicator')).toBeNull();
    });
  });

  it('should have proper accessibility attributes', () => {
    mockUseUIStore.mockReturnValue({
      networkStatus: 'offline',
      setNetworkStatus: mockSetNetworkStatus,
      addToOfflineQueue: mockAddToOfflineQueue,
      offlineQueue: [],
    } as any);

    const { getByTestId } = renderWithTheme(<NetworkStatusIndicator />);
    const indicator = getByTestId('network-status-indicator');
    
    expect(indicator.props.accessible).toBe(true);
    expect(indicator.props.accessibilityRole).toBe('alert');
    expect(indicator.props.accessibilityLabel).toContain('offline');
  });
});