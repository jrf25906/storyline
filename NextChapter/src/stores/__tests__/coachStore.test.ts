import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCoachStore } from '@stores/coachStore';
import { APP_CONFIG } from '@utils/constants';
import { CoachTone } from '@types/database';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));
// Mock OpenAI API if needed
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Test response from coach',
            },
          }],
        }),
      },
    },
  })),
}));

describe('CoachStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { result } = renderHook(() => useCoachStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('State Management', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useCoachStore());
      
      expect(result.current.conversations).toEqual([]);
      expect(result.current.localMessages).toEqual([]);
      expect(result.current.currentTone).toBe('pragmatist');
      expect(result.current.preferredTone).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSending).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Message Management', () => {
    it('should send a message and update state', async () => {
      const { result } = renderHook(() => useCoachStore());
      const userId = 'test-user-id';
      const message = 'Hello coach';

      await act(async () => {
        const response = await result.current.sendMessage(userId, message);
        expect(response).toBeDefined();
        expect(response?.message).toBe('Test response');
      });

      expect(result.current.localMessages).toHaveLength(2); // User message + assistant response
      expect(result.current.localMessages[0].message).toBe(message);
      expect(result.current.localMessages[0].role).toBe('user');
      expect(result.current.localMessages[1].message).toBe('Test response');
      expect(result.current.localMessages[1].role).toBe('assistant');
    });

    it('should detect tone in messages', () => {
      const { result } = renderHook(() => useCoachStore());
      
      const tone = result.current.detectTone('I feel hopeless');
      expect(tone).toBe('pragmatist'); // Based on our mock
    });
  });

  describe('Tone Management', () => {
    it('should set preferred tone', () => {
      const { result } = renderHook(() => useCoachStore());
      
      act(() => {
        result.current.setPreferredTone('hype');
      });

      expect(result.current.preferredTone).toBe('hype');
    });

    it('should set current tone', () => {
      const { result } = renderHook(() => useCoachStore());
      
      act(() => {
        result.current.setCurrentTone('tough-love');
      });

      expect(result.current.currentTone).toBe('tough-love');
    });
  });

  describe('Message Limits', () => {
    it('should track daily message count', async () => {
      const { result } = renderHook(() => useCoachStore());
      const userId = 'test-user-id';

      await act(async () => {
        await result.current.sendMessage(userId, 'Test message');
      });

      expect(result.current.getMessageCountToday()).toBe(1);
      expect(result.current.canSendMessage()).toBe(true);
    });

    it('should respect daily message limit', async () => {
      const { result } = renderHook(() => useCoachStore());
      const userId = 'test-user-id';

      // Send max messages
      for (let i = 0; i < APP_CONFIG.DAILY_MESSAGE_LIMIT_FREE; i++) {
        await act(async () => {
          await result.current.sendMessage(userId, `Message ${i}`);
        });
      }

      expect(result.current.canSendMessage()).toBe(false);
    });
  });

  describe('Conversation History', () => {
    it('should get all messages', async () => {
      const { result } = renderHook(() => useCoachStore());
      const userId = 'test-user-id';

      await act(async () => {
        await result.current.sendMessage(userId, 'Message 1');
        await result.current.sendMessage(userId, 'Message 2');
      });

      const allMessages = result.current.getAllMessages();
      expect(allMessages).toHaveLength(4); // 2 user + 2 assistant messages
    });

    it('should get conversation history with limit', async () => {
      const { result } = renderHook(() => useCoachStore());
      const userId = 'test-user-id';

      await act(async () => {
        await result.current.sendMessage(userId, 'Message 1');
        await result.current.sendMessage(userId, 'Message 2');
        await result.current.sendMessage(userId, 'Message 3');
      });

      const history = result.current.getConversationHistory(2);
      expect(history).toHaveLength(2); // Should return only last 2 messages
    });
  });

  describe('Offline Support', () => {
    it('should save offline messages', () => {
      const { result } = renderHook(() => useCoachStore());
      
      const offlineMessage = {
        id: 'offline-1',
        message: 'Offline message',
        role: 'user' as const,
        timestamp: new Date(),
        isOffline: true,
      };

      act(() => {
        result.current.saveOfflineMessage(offlineMessage);
      });

      expect(result.current.localMessages).toContainEqual(
        expect.objectContaining({
          id: 'offline-1',
          message: 'Offline message',
          isOffline: true,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle send message errors', async () => {
      const { result } = renderHook(() => useCoachStore());
      const userId = 'test-user-id';
      
      // Mock an error
      const { coachService } = require('@services/ai/coachService');
      coachService.sendMessage.mockRejectedValueOnce(new Error('API Error'));

      await act(async () => {
        const response = await result.current.sendMessage(userId, 'Test');
        expect(response).toBeNull();
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.isSending).toBe(false);
    });
  });
});