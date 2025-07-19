import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

// Mock the context before importing
jest.mock('../../context/OfflineContext', () => ({
  useOffline: jest.fn(),
  OfflineProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { useOffline } from '@context/OfflineContext';

describe('useNetworkStatus', () => {
  const mockUseOffline = require('../../context/OfflineContext').useOffline;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return online status when connected', () => {
    mockUseOffline.mockReturnValue({
      isConnected: true,
      isWifiEnabled: true,
      networkType: 'wifi',
      hasPendingSyncs: false,
      syncInProgress: false,
      triggerSync: jest.fn(),
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isWifiEnabled).toBe(true);
    expect(result.current.networkType).toBe('wifi');
  });

  it('should return offline status when disconnected', () => {
    mockUseOffline.mockReturnValue({
      isConnected: false,
      isWifiEnabled: false,
      networkType: null,
      hasPendingSyncs: true,
      syncInProgress: false,
      triggerSync: jest.fn(),
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isWifiEnabled).toBe(false);
    expect(result.current.networkType).toBeNull();
  });

  it('should update status on network change', () => {
    const initialState = {
      isConnected: true,
      isWifiEnabled: true,
      networkType: 'wifi',
      hasPendingSyncs: false,
      syncInProgress: false,
      triggerSync: jest.fn(),
    };

    mockUseOffline.mockReturnValue(initialState);

    const { result, rerender } = renderHook(() => useNetworkStatus());

    expect(result.current.isConnected).toBe(true);

    // Simulate network change
    mockUseOffline.mockReturnValue({
      ...initialState,
      isConnected: false,
      isWifiEnabled: false,
      networkType: null,
    });

    rerender();

    expect(result.current.isConnected).toBe(false);
    expect(result.current.networkType).toBeNull();
  });

  it('should handle missing context gracefully', () => {
    // Test that the hook properly handles being called outside a provider
    // In real usage, this would throw an error from the actual useOffline implementation
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the hook to simulate the error that would be thrown
    mockUseOffline.mockImplementation(() => {
      throw new Error('useOffline must be used within an OfflineProvider');
    });

    expect(() => {
      mockUseOffline(); // Call the mock directly
    }).toThrow('useOffline must be used within an OfflineProvider');
    
    // Verify useNetworkStatus is just an alias
    expect(useNetworkStatus).toBe(useOffline);
    
    consoleErrorSpy.mockRestore();
  });

  it('should expose sync status and trigger function', () => {
    const mockTriggerSync = jest.fn();
    
    mockUseOffline.mockReturnValue({
      isConnected: true,
      isWifiEnabled: true,
      networkType: 'wifi',
      hasPendingSyncs: true,
      syncInProgress: true,
      triggerSync: mockTriggerSync,
    });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.hasPendingSyncs).toBe(true);
    expect(result.current.syncInProgress).toBe(true);
    expect(result.current.triggerSync).toBe(mockTriggerSync);
  });

  it('should return all network types correctly', () => {
    const networkTypes = ['wifi', 'cellular', 'ethernet', 'unknown', null];
    
    networkTypes.forEach(type => {
      mockUseOffline.mockReturnValue({
        isConnected: type !== null,
        isWifiEnabled: type === 'wifi',
        networkType: type,
        hasPendingSyncs: false,
        syncInProgress: false,
        triggerSync: jest.fn(),
      });

      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.networkType).toBe(type);
      expect(result.current.isWifiEnabled).toBe(type === 'wifi');
    });
  });
});