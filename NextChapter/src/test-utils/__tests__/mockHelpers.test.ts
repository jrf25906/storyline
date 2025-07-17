import { renderHook, act } from '@testing-library/react-hooks';
import {
  createMockCoachStore,
  createMockBouncePlanStore,
  createMockBudgetStore,
  createMockJobTrackerStore,
  createMockWellnessStore,
  createMockOnboardingStore,
  createMockAuthStore,
  createMockZustandHook,
} from '../mockHelpers';

describe('Mock Helpers', () => {
  describe('createMockCoachStore', () => {
    it('should create a mock coach store with all required methods', () => {
      const mockStore = createMockCoachStore();

      // Check state properties
      expect(mockStore.conversations).toEqual([]);
      expect(mockStore.currentTone).toBe('pragmatist');
      expect(mockStore.isLoading).toBe(false);

      // Check methods exist and are mocks
      expect(mockStore.sendMessage).toBeDefined();
      expect(mockStore.clearConversations).toBeDefined();
      expect(mockStore.clearConversation).toBeDefined();
      expect(mockStore.detectTone).toBeDefined();
      expect(mockStore.reset).toBeDefined();

      // Check computed values
      expect(mockStore.getAllMessages()).toEqual([]);
      expect(mockStore.canSendMessage()).toBe(true);
    });

    it('should allow overriding default values', () => {
      const customMessages = [
        { id: '1', message: 'Test', role: 'user', timestamp: new Date() },
      ];

      const mockStore = createMockCoachStore({
        conversations: customMessages,
        currentTone: 'hype',
        isLoading: true,
        canSendMessage: jest.fn(() => false),
      });

      expect(mockStore.conversations).toEqual(customMessages);
      expect(mockStore.currentTone).toBe('hype');
      expect(mockStore.isLoading).toBe(true);
      expect(mockStore.canSendMessage()).toBe(false);
    });
  });

  describe('createMockBouncePlanStore', () => {
    it('should create a mock bounce plan store with all required methods', () => {
      const mockStore = createMockBouncePlanStore();

      // Check state
      expect(mockStore.tasks).toEqual([]);
      expect(mockStore.currentDay).toBe(1);
      expect(mockStore.isLoading).toBe(false);

      // Check methods
      expect(mockStore.completeTask).toBeDefined();
      expect(mockStore.skipTask).toBeDefined();
      expect(mockStore.resetProgress).toBeDefined();
      expect(mockStore.resetPlan).toBeDefined();

      // Verify resetPlan is an alias for resetProgress
      expect(mockStore.resetPlan).toBe(mockStore.resetProgress);

      // Check computed values
      expect(mockStore.getCompletedTasksCount()).toBe(0);
      expect(mockStore.canAccessTask(1)).toBe(true);
    });

    it('should handle resetPlan alias correctly', async () => {
      const mockStore = createMockBouncePlanStore();

      await mockStore.resetPlan('user-123');

      expect(mockStore.resetProgress).toHaveBeenCalledWith('user-123');
    });
  });

  describe('createMockBudgetStore', () => {
    it('should create a mock budget store with all required methods', () => {
      const mockStore = createMockBudgetStore();

      // Check state
      expect(mockStore.budgetData).toBeNull();
      expect(mockStore.runway).toBeNull();
      expect(mockStore.alerts).toEqual([]);

      // Check methods
      expect(mockStore.calculateRunway).toBeDefined();
      expect(mockStore.saveBudget).toBeDefined();
      expect(mockStore.addBudgetEntry).toBeDefined();

      // Check computed values
      expect(mockStore.getTotalMonthlyIncome()).toBe(0);
      expect(mockStore.hasLowRunway()).toBe(false);
    });
  });

  describe('createMockJobTrackerStore', () => {
    it('should create a mock job tracker store with sync methods', () => {
      const mockStore = createMockJobTrackerStore();

      // Check state
      expect(mockStore.applications).toEqual([]);
      expect(mockStore.selectedStatus).toBe('all');
      expect(mockStore.offlineQueue).toEqual([]);

      // Check sync methods
      expect(mockStore.hasPendingSyncs()).toBe(false);
      expect(mockStore.getSyncStatus()).toEqual({
        pendingOperations: 0,
        lastSync: undefined,
      });
      expect(mockStore.getOfflineApplications()).toEqual([]);
    });
  });

  describe('createMockZustandHook', () => {
    it('should create a hook that returns the full store', () => {
      const mockStore = createMockCoachStore();
      const useStore = createMockZustandHook(mockStore);

      const { result } = renderHook(() => useStore());

      expect(result.current).toBe(mockStore);
      expect(result.current.sendMessage).toBeDefined();
      expect(result.current.clearConversations).toBeDefined();
    });

    it('should support selector pattern', () => {
      const mockStore = createMockCoachStore({
        currentTone: 'tough-love',
        messageCount: 42,
      });
      const useStore = createMockZustandHook(mockStore);

      // Test selecting single value
      const { result: toneResult } = renderHook(() =>
        useStore((state) => state.currentTone)
      );
      expect(toneResult.current).toBe('tough-love');

      // Test selecting multiple values
      const { result: multiResult } = renderHook(() =>
        useStore((state) => ({
          tone: state.currentTone,
          count: state.messageCount,
        }))
      );
      expect(multiResult.current).toEqual({
        tone: 'tough-love',
        count: 42,
      });
    });
  });

  describe('Integration with jest.mock', () => {
    // This demonstrates how to use the mocks in actual tests
    it('should work with jest.mock pattern', () => {
      // Create the mock
      const mockCoachStore = createMockCoachStore({
        sendMessage: jest.fn().mockResolvedValue({
          id: 'test-123',
          message: 'Hello',
          role: 'user',
          timestamp: new Date(),
        }),
      });

      // Create the hook
      const useCoachStore = createMockZustandHook(mockCoachStore);

      // Use in a hook
      const { result } = renderHook(() => useCoachStore());

      // Verify it works
      expect(result.current.sendMessage).toBeDefined();
      expect(typeof result.current.sendMessage).toBe('function');
    });
  });

  describe('Mock method behavior', () => {
    it('should allow mocking async methods with custom implementations', async () => {
      const mockStore = createMockBouncePlanStore({
        completeTask: jest.fn().mockImplementation(async (userId, taskId) => {
          // Simulate updating local state
          mockStore.localProgress[taskId] = {
            taskId,
            completed: true,
            completedAt: new Date().toISOString(),
          };
        }),
      });

      await mockStore.completeTask('user-123', 'task-456');

      expect(mockStore.completeTask).toHaveBeenCalledWith('user-123', 'task-456');
      expect(mockStore.localProgress['task-456']).toEqual({
        taskId: 'task-456',
        completed: true,
        completedAt: expect.any(String),
      });
    });

    it('should handle mock implementation updates', () => {
      const mockStore = createMockWellnessStore();

      // Initial implementation
      mockStore.getTrend.mockReturnValue('stable');
      expect(mockStore.getTrend()).toBe('stable');

      // Update implementation
      mockStore.getTrend.mockReturnValue('improving');
      expect(mockStore.getTrend()).toBe('improving');
    });
  });
});