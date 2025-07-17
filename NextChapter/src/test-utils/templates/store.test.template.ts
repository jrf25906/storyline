import { renderHook, act } from '@testing-library/react-hooks';
import { useStoreName } from '../storeName';

describe('useStoreName', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useStoreName());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useStoreName());

      expect(result.current.items).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Actions', () => {
    it('should add item', () => {
      const { result } = renderHook(() => useStoreName());
      const newItem = { id: '1', name: 'Test Item' };

      act(() => {
        result.current.addItem(newItem);
      });

      expect(result.current.items).toContainEqual(newItem);
    });

    it('should update item', () => {
      const { result } = renderHook(() => useStoreName());
      const item = { id: '1', name: 'Original' };
      
      act(() => {
        result.current.addItem(item);
      });

      act(() => {
        result.current.updateItem('1', { name: 'Updated' });
      });

      expect(result.current.items[0].name).toBe('Updated');
    });

    it('should delete item', () => {
      const { result } = renderHook(() => useStoreName());
      
      act(() => {
        result.current.addItem({ id: '1', name: 'Test' });
      });

      act(() => {
        result.current.deleteItem('1');
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Async Operations', () => {
    it('should handle loading state', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useStoreName());

      act(() => {
        result.current.fetchItems();
      });

      expect(result.current.loading).toBe(true);

      await waitForNextUpdate();

      expect(result.current.loading).toBe(false);
    });

    it('should handle errors', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useStoreName());

      // Mock error
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      act(() => {
        result.current.fetchItems();
      });

      await waitForNextUpdate();

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Computed Values', () => {
    it('should calculate derived state correctly', () => {
      const { result } = renderHook(() => useStoreName());

      act(() => {
        result.current.addItem({ id: '1', completed: true });
        result.current.addItem({ id: '2', completed: false });
      });

      expect(result.current.completedCount).toBe(1);
      expect(result.current.pendingCount).toBe(1);
    });
  });

  describe('Persistence', () => {
    it('should persist to storage', () => {
      const { result } = renderHook(() => useStoreName());
      const mockSetItem = jest.fn();
      
      // Mock AsyncStorage
      jest.mock('@react-native-async-storage/async-storage', () => ({
        setItem: mockSetItem,
      }));

      act(() => {
        result.current.addItem({ id: '1', name: 'Test' });
      });

      expect(mockSetItem).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Test')
      );
    });
  });
});