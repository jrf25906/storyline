/**
 * Example test file showing how to properly mock Zustand stores
 * This demonstrates solutions to common mocking errors
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  createMockCoachStore,
  createMockBouncePlanStore,
  createMockZustandHook,
} from '@test-utils/mockHelpers';

// Mock the stores BEFORE importing components that use them
const mockCoachStore = createMockCoachStore();
const mockBouncePlanStore = createMockBouncePlanStore();

jest.mock('@stores/coachStore', () => ({
  useCoachStore: createMockZustandHook(mockCoachStore),
}));

jest.mock('@stores/bouncePlanStore', () => ({
  useBouncePlanStore: createMockZustandHook(mockBouncePlanStore),
}));

// Example component that uses stores
const CoachMessageSender: React.FC = () => {
  const { sendMessage, isLoading, error } = useCoachStore();
  const [message, setMessage] = React.useState('');

  const handleSend = async () => {
    await sendMessage('user-123', message);
    setMessage('');
  };

  return (
    <View>
      <Text testID="loading">{isLoading ? 'Sending...' : 'Ready'}</Text>
      {error && <Text testID="error">{error}</Text>}
      <TouchableOpacity onPress={handleSend} testID="send-button">
        <Text>Send</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example component with selector
const ToneDisplay: React.FC = () => {
  const currentTone = useCoachStore((state) => state.currentTone);
  return <Text testID="tone">{currentTone}</Text>;
};

// Example bounce plan component
const TaskManager: React.FC = () => {
  const { resetPlan, completeTask, tasks } = useBouncePlanStore();

  return (
    <View>
      <Text testID="task-count">{tasks.length} tasks</Text>
      <TouchableOpacity onPress={() => resetPlan('user-123')} testID="reset-button">
        <Text>Reset Plan</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => completeTask('user-123', 'task-1')} 
        testID="complete-button"
      >
        <Text>Complete Task</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('Store Mocking Examples', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Store Usage', () => {
    it('should access store methods without errors', () => {
      const { result } = renderHook(() => useCoachStore());

      // All methods should be defined and callable
      expect(result.current.sendMessage).toBeDefined();
      expect(result.current.clearConversations).toBeDefined();
      expect(result.current.reset).toBeDefined();
      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('should handle async methods properly', async () => {
      mockCoachStore.sendMessage.mockResolvedValueOnce({
        id: 'msg-123',
        message: 'Test message',
        role: 'user',
        timestamp: new Date(),
      });

      const { result } = renderHook(() => useCoachStore());

      const message = await result.current.sendMessage('user-123', 'Hello');

      expect(message).toEqual({
        id: 'msg-123',
        message: 'Test message',
        role: 'user',
        timestamp: expect.any(Date),
      });
      expect(mockCoachStore.sendMessage).toHaveBeenCalledWith('user-123', 'Hello');
    });
  });

  describe('Component Integration', () => {
    it('should render component with mocked store', async () => {
      mockCoachStore.isLoading = false;
      mockCoachStore.sendMessage.mockResolvedValueOnce(null);

      const { getByTestId } = render(<CoachMessageSender />);

      expect(getByTestId('loading')).toHaveTextContent('Ready');

      fireEvent.press(getByTestId('send-button'));

      await waitFor(() => {
        expect(mockCoachStore.sendMessage).toHaveBeenCalled();
      });
    });

    it('should handle error states', () => {
      // Update mock store state
      mockCoachStore.error = 'Network error';

      const { getByTestId } = render(<CoachMessageSender />);

      expect(getByTestId('error')).toHaveTextContent('Network error');
    });
  });

  describe('Selector Pattern', () => {
    it('should work with store selectors', () => {
      // Set up mock state
      mockCoachStore.currentTone = 'hype';

      const { getByTestId } = render(<ToneDisplay />);

      expect(getByTestId('tone')).toHaveTextContent('hype');
    });

    it('should handle complex selectors', () => {
      const { result } = renderHook(() =>
        useCoachStore((state) => ({
          tone: state.currentTone,
          hasMessages: state.messageCount > 0,
          canSend: state.canSendMessage(),
        }))
      );

      expect(result.current).toEqual({
        tone: 'pragmatist',
        hasMessages: false,
        canSend: true,
      });
    });
  });

  describe('Bounce Plan Store - resetPlan alias', () => {
    it('should handle resetPlan method correctly', async () => {
      const { getByTestId } = render(<TaskManager />);

      fireEvent.press(getByTestId('reset-button'));

      await waitFor(() => {
        // resetPlan should call resetProgress
        expect(mockBouncePlanStore.resetProgress).toHaveBeenCalledWith('user-123');
      });
    });

    it('should handle completeTask method', async () => {
      mockBouncePlanStore.completeTask.mockResolvedValueOnce(undefined);

      const { getByTestId } = render(<TaskManager />);

      fireEvent.press(getByTestId('complete-button'));

      await waitFor(() => {
        expect(mockBouncePlanStore.completeTask).toHaveBeenCalledWith(
          'user-123',
          'task-1'
        );
      });
    });
  });

  describe('Dynamic State Updates', () => {
    it('should update mock state during test', () => {
      const { result, rerender } = renderHook(() => useCoachStore());

      expect(result.current.messageCount).toBe(0);

      // Update mock state
      act(() => {
        mockCoachStore.messageCount = 5;
      });

      rerender();

      expect(result.current.messageCount).toBe(5);
    });

    it('should mock implementation changes', async () => {
      // Initial implementation
      mockCoachStore.canSendMessage.mockReturnValue(true);

      let { result } = renderHook(() => useCoachStore());
      expect(result.current.canSendMessage()).toBe(true);

      // Change implementation mid-test
      mockCoachStore.canSendMessage.mockReturnValue(false);

      result = renderHook(() => useCoachStore()).result;
      expect(result.current.canSendMessage()).toBe(false);
    });
  });

  describe('Multiple Store Integration', () => {
    const MultiStoreComponent: React.FC = () => {
      const { currentTone } = useCoachStore();
      const { currentDay } = useBouncePlanStore();

      return (
        <View>
          <Text testID="tone">Tone: {currentTone}</Text>
          <Text testID="day">Day: {currentDay}</Text>
        </View>
      );
    };

    it('should work with multiple mocked stores', () => {
      mockCoachStore.currentTone = 'tough-love';
      mockBouncePlanStore.currentDay = 15;

      const { getByTestId } = render(<MultiStoreComponent />);

      expect(getByTestId('tone')).toHaveTextContent('Tone: tough-love');
      expect(getByTestId('day')).toHaveTextContent('Day: 15');
    });
  });
});

// Import stores after mocks are set up
import { useCoachStore } from '@stores/coachStore';
import { useBouncePlanStore } from '@stores/bouncePlanStore';