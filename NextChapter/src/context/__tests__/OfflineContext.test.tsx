import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { OfflineProvider, useOffline } from '@context/OfflineContext';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { advanceTimersWithAct, runPendingTimersWithAct } from '@test-utils/test-act-utils';
import { NETWORK_STATES, createMockNetInfoState } from '@test-utils/mockHelpers';

// Mock syncManager
jest.mock('../../services/database/sync/syncManager', () => ({
  syncManager: {
    hasPendingSyncs: jest.fn(),
    syncAll: jest.fn(),
    syncBouncePlan: jest.fn(),
    syncApplications: jest.fn(),
    syncBudget: jest.fn(),
    syncMoods: jest.fn(),
  }
}));

// Get mocked NetInfo and syncManager from global mocks
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo> & {
  __triggerNetworkStateChange: (state: any) => void;
};
const mockSyncManager = require('../../services/database/sync/syncManager').syncManager;

describe('OfflineContext', () => {
  const mockUnsubscribe = jest.fn();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockNetInfo.addEventListener.mockReturnValue(mockUnsubscribe);
    
    // Reset sync manager state
    mockSyncManager.hasPendingSyncs.mockReturnValue(false);
    mockSyncManager.syncAll.mockResolvedValue({ success: true, errors: [] });
  });

  afterEach(async () => {
    await runPendingTimersWithAct();
    jest.useRealTimers();
  });
  
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OfflineProvider>{children}</OfflineProvider>
  );

  it('should provide network status to children', async () => {
    const { result } = renderHook(() => useOffline(), { wrapper });

    // Initial state
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isWifiEnabled).toBe(false);
    expect(result.current.networkType).toBeNull();

    // Get the listener that was registered
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];
    expect(mockListener).toBeDefined();

    // Simulate network state change
    await act(async () => {
      mockListener?.(NETWORK_STATES.wifi);
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isWifiEnabled).toBe(true);
    expect(result.current.networkType).toBe(NetInfoStateType.wifi);
  });

  it('should check pending syncs periodically', async () => {
    mockSyncManager.hasPendingSyncs.mockReturnValue(true);

    renderHook(() => useOffline(), { wrapper });

    // Wait for initial effect to run
    await act(async () => {
      await Promise.resolve();
    });

    // Initial check should have happened
    expect(mockSyncManager.hasPendingSyncs).toHaveBeenCalledTimes(1);

    // Fast-forward 5 seconds
    await advanceTimersWithAct(5000);

    expect(mockSyncManager.hasPendingSyncs).toHaveBeenCalledTimes(2);

    // Fast-forward another 5 seconds
    await advanceTimersWithAct(5000);

    expect(mockSyncManager.hasPendingSyncs).toHaveBeenCalledTimes(3);
  });

  it('should cleanup intervals on unmount', async () => {
    const { unmount } = renderHook(() => useOffline(), { wrapper });

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    await act(async () => {
      unmount();
    });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('should handle network disconnection', async () => {
    const { result } = renderHook(() => useOffline(), { wrapper });
    
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    await act(async () => {
      mockListener?.(NETWORK_STATES.none);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isWifiEnabled).toBe(false);
    expect(result.current.networkType).toBe(NetInfoStateType.none);
  });

  it('should auto-sync when coming back online with pending syncs', async () => {
    mockSyncManager.hasPendingSyncs.mockReturnValue(true);
    mockSyncManager.syncAll.mockResolvedValue({ success: true, errors: [] });

    const { result } = renderHook(() => useOffline(), { wrapper });
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    // Wait for initial state
    await act(async () => {
      await Promise.resolve();
    });

    // Start offline
    await act(async () => {
      mockListener?.(NETWORK_STATES.none);
    });

    // Come back online
    await act(async () => {
      mockListener?.(NETWORK_STATES.wifi);
      // Allow effect to run
      await Promise.resolve();
    });

    // Verify sync was triggered
    await act(async () => {
      // Wait for async operations
      await Promise.resolve();
    });

    expect(mockSyncManager.syncAll).toHaveBeenCalledTimes(1);
  });

  it('should handle manual sync trigger', async () => {
    mockSyncManager.syncAll.mockResolvedValue({ success: true, errors: [] });

    const { result } = renderHook(() => useOffline(), { wrapper });
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    // Set online
    await act(async () => {
      mockListener?.(NETWORK_STATES.wifi);
    });

    await act(async () => {
      await result.current.triggerSync();
    });

    expect(mockSyncManager.syncAll).toHaveBeenCalledTimes(1);
  });

  it('should not sync when offline', async () => {
    const { result } = renderHook(() => useOffline(), { wrapper });
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    // Set offline
    await act(async () => {
      mockListener?.(NETWORK_STATES.none);
    });

    await act(async () => {
      await result.current.triggerSync();
    });

    expect(mockSyncManager.syncAll).not.toHaveBeenCalled();
  });

  it('should not sync when sync is already in progress', async () => {
    // Make syncAll take time
    mockSyncManager.syncAll.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, errors: [] }), 1000))
    );

    const { result } = renderHook(() => useOffline(), { wrapper });
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    // Set online
    await act(async () => {
      mockListener?.(NETWORK_STATES.wifi);
    });

    // Start first sync
    act(() => {
      result.current.triggerSync();
    });

    // Try to trigger another sync while first is in progress
    await act(async () => {
      await result.current.triggerSync();
    });

    expect(mockSyncManager.syncAll).toHaveBeenCalledTimes(1);
  });

  it('should handle sync errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSyncManager.syncAll.mockRejectedValue(new Error('Sync failed'));

    const { result } = renderHook(() => useOffline(), { wrapper });
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    // Set online
    await act(async () => {
      mockListener?.(NETWORK_STATES.wifi);
    });

    await act(async () => {
      await result.current.triggerSync();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Sync failed:', expect.any(Error));
    expect(result.current.syncInProgress).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should handle partial sync failures', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSyncManager.syncAll.mockResolvedValue({ 
      success: false, 
      errors: ['Error 1', 'Error 2'] 
    });

    const { result } = renderHook(() => useOffline(), { wrapper });
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    // Set online
    await act(async () => {
      mockListener?.(NETWORK_STATES.wifi);
    });

    await act(async () => {
      await result.current.triggerSync();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Sync errors:', ['Error 1', 'Error 2']);

    consoleErrorSpy.mockRestore();
  });

  it('should throw error when useOffline is used outside provider', () => {
    // Temporarily restore console.error for this test
    consoleErrorSpy.mockRestore();
    const localConsoleError = jest.spyOn(console, 'error').mockImplementation();

    const TestComponent = () => {
      useOffline();
      return <Text>Test</Text>;
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useOffline must be used within an OfflineProvider');
    
    localConsoleError.mockRestore();
    // Re-mock for other tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle null/undefined network states', async () => {
    const { result } = renderHook(() => useOffline(), { wrapper });
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    await act(async () => {
      mockListener?.(NETWORK_STATES.unknown);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isWifiEnabled).toBe(false);
    expect(result.current.networkType).toBe(NetInfoStateType.unknown);
  });

  it('should handle different network types correctly', async () => {
    const { result } = renderHook(() => useOffline(), { wrapper });
    const mockListener = mockNetInfo.addEventListener.mock.calls[0]?.[0];

    const networkTypes: NetInfoStateType[] = [
      NetInfoStateType.wifi,
      NetInfoStateType.cellular,
      NetInfoStateType.ethernet,
      NetInfoStateType.wimax,
      NetInfoStateType.bluetooth,
      NetInfoStateType.unknown
    ];

    for (const type of networkTypes) {
      await act(async () => {
        mockListener?.(createMockNetInfoState(type));
      });

      expect(result.current.networkType).toBe(type);
      expect(result.current.isWifiEnabled).toBe(type === NetInfoStateType.wifi);
    }
  });
});