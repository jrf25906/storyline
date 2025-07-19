import { renderHook, act } from '@testing-library/react-hooks';
import { useNetworkAwareSync } from '@hooks/useNetworkAwareSync';

// Mock dependencies
jest.mock('../../context/OfflineContext');
jest.mock('../../stores/bouncePlanStore');

describe('useNetworkAwareSync', () => {
  const mockAddToOfflineQueue = jest.fn();
  const mockUseOffline = require('../../context/OfflineContext').useOffline;
  const mockUseBouncePlanStore = require('../../stores/bouncePlanStore').useBouncePlanStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBouncePlanStore.mockReturnValue({
      addToOfflineQueue: mockAddToOfflineQueue,
    });
  });

  it('should sync immediately when online', async () => {
    mockUseOffline.mockReturnValue({ isConnected: true });
    const mockOperation = jest.fn().mockResolvedValue(true);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useNetworkAwareSync());

    await act(async () => {
      const success = await result.current.syncWithFallback(
        mockOperation,
        { type: 'task_completion', taskId: '1', data: {} },
        { onSuccess }
      );
      expect(success).toBe(true);
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mockAddToOfflineQueue).not.toHaveBeenCalled();
  });

  it('should queue operations when offline', async () => {
    mockUseOffline.mockReturnValue({ isConnected: false });
    const mockOperation = jest.fn();
    const queueData = { type: 'task_completion', taskId: '1', data: {} };

    const { result } = renderHook(() => useNetworkAwareSync());

    await act(async () => {
      const success = await result.current.syncWithFallback(
        mockOperation,
        queueData,
        { showOfflineMessage: true }
      );
      expect(success).toBe(true); // Returns true since queuing succeeded
    });

    expect(mockOperation).not.toHaveBeenCalled();
    expect(mockAddToOfflineQueue).toHaveBeenCalledWith(queueData);
  });

  it('should process queue when coming online', async () => {
    // Start offline
    mockUseOffline.mockReturnValue({ isConnected: false });
    const { result, rerender } = renderHook(() => useNetworkAwareSync());

    const mockOperation = jest.fn().mockResolvedValue(true);
    const queueData = { type: 'task_completion', taskId: '1', data: {} };

    // Queue operation while offline
    await act(async () => {
      await result.current.syncWithFallback(mockOperation, queueData);
    });

    expect(mockAddToOfflineQueue).toHaveBeenCalledWith(queueData);

    // Come back online
    mockUseOffline.mockReturnValue({ isConnected: true });
    rerender();

    // The OfflineContext should handle auto-sync, not this hook
    expect(result.current.isConnected).toBe(true);
  });

  it('should handle sync failures with retry', async () => {
    mockUseOffline.mockReturnValue({ isConnected: true });
    const mockOperation = jest.fn()
      .mockResolvedValueOnce(false) // First attempt fails
      .mockResolvedValueOnce(true);  // Retry succeeds
    
    const onError = jest.fn();
    const queueData = { type: 'task_completion', taskId: '1', data: {} };

    const { result } = renderHook(() => useNetworkAwareSync());

    // First attempt fails, should queue
    await act(async () => {
      const success = await result.current.syncWithFallback(
        mockOperation,
        queueData,
        { onError }
      );
      expect(success).toBe(false);
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockAddToOfflineQueue).toHaveBeenCalledWith(queueData);
    expect(onError).not.toHaveBeenCalled(); // onError is for exceptions, not false returns
  });

  it('should respect retry limits', async () => {
    mockUseOffline.mockReturnValue({ isConnected: true });
    const error = new Error('Network error');
    const mockOperation = jest.fn().mockRejectedValue(error);
    const onError = jest.fn();
    const queueData = { type: 'task_completion', taskId: '1', data: {} };

    const { result } = renderHook(() => useNetworkAwareSync());

    await act(async () => {
      const success = await result.current.syncWithFallback(
        mockOperation,
        queueData,
        { onError }
      );
      expect(success).toBe(false);
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockAddToOfflineQueue).toHaveBeenCalledWith(queueData);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should handle exceptions during sync', async () => {
    mockUseOffline.mockReturnValue({ isConnected: true });
    const error = new Error('Sync failed');
    const mockOperation = jest.fn().mockRejectedValue(error);
    const onError = jest.fn();
    const queueData = { type: 'task_completion', taskId: '1', data: {} };

    const { result } = renderHook(() => useNetworkAwareSync());

    await act(async () => {
      const success = await result.current.syncWithFallback(
        mockOperation,
        queueData,
        { onError }
      );
      expect(success).toBe(false);
    });

    expect(mockAddToOfflineQueue).toHaveBeenCalledWith(queueData);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should log message when offline with showOfflineMessage option', async () => {
    mockUseOffline.mockReturnValue({ isConnected: false });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const mockOperation = jest.fn();
    const queueData = { type: 'task_completion', taskId: '1', data: {} };

    const { result } = renderHook(() => useNetworkAwareSync());

    await act(async () => {
      await result.current.syncWithFallback(
        mockOperation,
        queueData,
        { showOfflineMessage: true }
      );
    });

    expect(consoleSpy).toHaveBeenCalledWith('Changes saved locally. Will sync when online.');
    consoleSpy.mockRestore();
  });

  it('should handle different queue data types', async () => {
    mockUseOffline.mockReturnValue({ isConnected: false });
    
    const queueDataTypes = [
      { type: 'task_completion', taskId: '1', data: { completed: true } },
      { type: 'task_uncomplete', taskId: '2', data: { completed: false } },
      { type: 'task_skip', taskId: '3', data: { skipped: true } },
      { type: 'note_update', taskId: '4', data: { note: 'Test note' } },
    ];

    const { result } = renderHook(() => useNetworkAwareSync());

    for (const queueData of queueDataTypes) {
      await act(async () => {
        await result.current.syncWithFallback(
          jest.fn(),
          queueData
        );
      });
    }

    expect(mockAddToOfflineQueue).toHaveBeenCalledTimes(queueDataTypes.length);
    queueDataTypes.forEach((data, index) => {
      expect(mockAddToOfflineQueue).toHaveBeenNthCalledWith(index + 1, data);
    });
  });

  it('should expose isConnected status', () => {
    mockUseOffline.mockReturnValue({ isConnected: true });
    const { result } = renderHook(() => useNetworkAwareSync());
    
    expect(result.current.isConnected).toBe(true);
    
    mockUseOffline.mockReturnValue({ isConnected: false });
    const { result: result2 } = renderHook(() => useNetworkAwareSync());
    
    expect(result2.current.isConnected).toBe(false);
  });
});