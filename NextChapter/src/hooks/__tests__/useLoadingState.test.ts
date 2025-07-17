import { renderHook, act } from '@testing-library/react-native';
import { useLoadingState } from '../useLoadingState';
import { useUIStore } from '../../stores/uiStore';

// Mock the UI store
jest.mock('../../stores/uiStore');

describe('useLoadingState', () => {
  const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;
  const mockSetFeatureLoading = jest.fn();
  const mockSetFeatureError = jest.fn();
  const mockClearFeatureError = jest.fn();
  const mockIsFeatureLoading = jest.fn();
  const mockGetFeatureError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUIStore.mockReturnValue({
      setFeatureLoading: mockSetFeatureLoading,
      setFeatureError: mockSetFeatureError,
      clearFeatureError: mockClearFeatureError,
      isFeatureLoading: mockIsFeatureLoading,
      getFeatureError: mockGetFeatureError,
    } as any);
  });

  it('should initialize with correct state', () => {
    mockIsFeatureLoading.mockReturnValue(false);
    mockGetFeatureError.mockReturnValue(undefined);

    const { result } = renderHook(() => useLoadingState('test-feature'));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle async operations successfully', async () => {
    mockIsFeatureLoading.mockReturnValue(false);
    mockGetFeatureError.mockReturnValue(undefined);

    const { result } = renderHook(() => useLoadingState('test-feature'));
    
    const asyncOperation = jest.fn().mockResolvedValue('success');

    let promise: Promise<string>;
    act(() => {
      promise = result.current.execute(asyncOperation);
    });

    // Should set loading to true
    expect(mockSetFeatureLoading).toHaveBeenCalledWith('test-feature', true);
    expect(mockClearFeatureError).toHaveBeenCalledWith('test-feature');

    const resolvedValue = await act(async () => await promise!);

    // Should set loading to false after completion
    expect(mockSetFeatureLoading).toHaveBeenCalledWith('test-feature', false);
    expect(resolvedValue).toBe('success');
  });

  it('should handle async operation errors', async () => {
    mockIsFeatureLoading.mockReturnValue(false);
    mockGetFeatureError.mockReturnValue(undefined);

    const { result } = renderHook(() => useLoadingState('test-feature'));
    
    const error = new Error('Test error');
    const asyncOperation = jest.fn().mockRejectedValue(error);

    await act(async () => {
      await expect(result.current.execute(asyncOperation)).rejects.toThrow('Test error');
    });

    // Should set error
    expect(mockSetFeatureError).toHaveBeenCalledWith(
      'test-feature',
      'Test error'
    );
    expect(mockSetFeatureLoading).toHaveBeenCalledWith('test-feature', false);
  });

  it('should use custom error message', async () => {
    mockIsFeatureLoading.mockReturnValue(false);
    mockGetFeatureError.mockReturnValue(undefined);

    const { result } = renderHook(() => 
      useLoadingState('test-feature', {
        errorMessage: 'Custom error message',
      })
    );
    
    const error = new Error('Original error');
    const asyncOperation = jest.fn().mockRejectedValue(error);

    await act(async () => {
      await expect(result.current.execute(asyncOperation)).rejects.toThrow('Original error');
    });

    expect(mockSetFeatureError).toHaveBeenCalledWith(
      'test-feature',
      'Custom error message'
    );
  });

  it('should handle error callback', async () => {
    const onError = jest.fn();
    mockIsFeatureLoading.mockReturnValue(false);
    mockGetFeatureError.mockReturnValue(undefined);

    const { result } = renderHook(() => 
      useLoadingState('test-feature', { onError })
    );
    
    const error = new Error('Test error');
    const asyncOperation = jest.fn().mockRejectedValue(error);

    await act(async () => {
      await expect(result.current.execute(asyncOperation)).rejects.toThrow('Test error');
    });

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should clear error', () => {
    mockIsFeatureLoading.mockReturnValue(false);
    mockGetFeatureError.mockReturnValue('Some error');

    const { result } = renderHook(() => useLoadingState('test-feature'));

    act(() => {
      result.current.clearError();
    });

    expect(mockClearFeatureError).toHaveBeenCalledWith('test-feature');
  });

  it('should return loading state', () => {
    mockIsFeatureLoading.mockReturnValue(true);
    mockGetFeatureError.mockReturnValue(undefined);

    const { result } = renderHook(() => useLoadingState('test-feature'));

    expect(result.current.isLoading).toBe(true);
  });

  it('should return error state', () => {
    mockIsFeatureLoading.mockReturnValue(false);
    mockGetFeatureError.mockReturnValue('Test error');

    const { result } = renderHook(() => useLoadingState('test-feature'));

    expect(result.current.error).toBe('Test error');
  });
});