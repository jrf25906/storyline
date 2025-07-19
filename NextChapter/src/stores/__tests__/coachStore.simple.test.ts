import { renderHook, act } from '@testing-library/react-native';
import { useCoachStore } from '@stores/coachStore';
import { CoachTone } from '@types/database';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'db-message-1',
            user_id: 'test-user-id',
            message: 'Test message',
            role: 'user',
            tone: 'pragmatist',
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      })),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('CoachStore - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useCoachStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCoachStore());
    
    expect(result.current.conversations).toEqual([]);
    expect(result.current.localMessages).toEqual([]);
    expect(result.current.currentTone).toBe('pragmatist');
    expect(result.current.preferredTone).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSending).toBe(false);
  });

  it('should detect tone from message', () => {
    const { result } = renderHook(() => useCoachStore());
    
    // Test hype triggers
    expect(result.current.detectTone('I feel hopeless')).toBe('hype');
    expect(result.current.detectTone('I am lost')).toBe('hype');
    
    // Test tough-love triggers
    expect(result.current.detectTone('They screwed me over')).toBe('tough-love');
    expect(result.current.detectTone('No one will hire me')).toBe('tough-love');
    
    // Test default
    expect(result.current.detectTone('Hello there')).toBe('pragmatist');
  });

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

  it('should track message count', () => {
    const { result } = renderHook(() => useCoachStore());
    
    expect(result.current.getMessageCountToday()).toBe(0);
    expect(result.current.canSendMessage()).toBe(true);
  });

  it('should save offline message', () => {
    const { result } = renderHook(() => useCoachStore());
    
    const message = {
      id: 'offline-1',
      message: 'Test offline message',
      role: 'user' as const,
      tone: 'pragmatist' as CoachTone,
      timestamp: new Date(),
      isOffline: true,
    };
    
    act(() => {
      result.current.saveOfflineMessage(message);
    });
    
    expect(result.current.localMessages).toHaveLength(1);
    expect(result.current.localMessages[0]).toEqual(message);
  });


  it('should reset store', () => {
    const { result } = renderHook(() => useCoachStore());
    
    act(() => {
      result.current.setPreferredTone('hype');
      result.current.setCurrentTone('tough-love');
      result.current.saveOfflineMessage({
        id: '1',
        message: 'Test',
        role: 'user',
        tone: 'pragmatist' as CoachTone,
        timestamp: new Date(),
      });
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.preferredTone).toBeNull();
    expect(result.current.currentTone).toBe('pragmatist');
    expect(result.current.localMessages).toHaveLength(0);
  });
});