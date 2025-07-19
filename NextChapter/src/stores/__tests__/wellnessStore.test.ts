import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWellnessStore } from '@stores/wellnessStore';
import { MoodValue, MoodEntry, CRISIS_KEYWORDS } from '@types';
import { wellnessService } from '@services/wellness/wellnessService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/wellness/wellnessService');

describe('wellnessStore', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockWellnessService = wellnessService as jest.Mocked<typeof wellnessService>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset async storage mock
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    // Reset store to initial state by getting fresh state
    useWellnessStore.setState({
      currentMood: null,
      recentMoods: [],
      trends: {},
      lastCheckInDate: undefined,
      streakDays: 0,
      isLoading: false,
      error: null,
      lastSync: undefined,
    });
  });

  describe('addMoodEntry', () => {
    it('should add a new mood entry', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const moodData = {
        value: MoodValue.Good,
        note: 'Feeling optimistic about interviews',
      };

      const expectedEntry: MoodEntry = {
        id: 'mock-id',
        userId: 'user-1',
        value: MoodValue.Good,
        note: 'Feeling optimistic about interviews',
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false,
      };

      mockWellnessService.saveMoodEntry.mockResolvedValue(expectedEntry);

      await act(async () => {
        await result.current.addMoodEntry(moodData);
      });

      expect(result.current.currentMood).toEqual(expectedEntry);
      expect(result.current.recentMoods).toContain(expectedEntry);
      expect(mockWellnessService.saveMoodEntry).toHaveBeenCalledWith(moodData);
    });

    it('should update last check-in date', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const moodData = { value: MoodValue.Neutral };
      
      mockWellnessService.saveMoodEntry.mockResolvedValue({
        id: 'mock-id',
        userId: 'user-1',
        value: MoodValue.Neutral,
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false,
      } as MoodEntry);

      await act(async () => {
        await result.current.addMoodEntry(moodData);
      });

      expect(result.current.lastCheckInDate).toBeTruthy();
    });

    it('should handle errors gracefully', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const error = new Error('Failed to save mood');
      mockWellnessService.saveMoodEntry.mockRejectedValue(error);

      await act(async () => {
        await expect(result.current.addMoodEntry({ value: MoodValue.Low }))
          .rejects.toThrow('Failed to save mood');
      });

      expect(result.current.error).toBe('Failed to save mood');
      expect(result.current.currentMood).toBeNull();
    });
  });

  describe('loadRecentMoods', () => {
    it('should load recent mood entries', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const mockMoods: MoodEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          value: MoodValue.Good,
          createdAt: new Date('2025-01-09'),
          updatedAt: new Date('2025-01-09'),
          synced: true,
        },
        {
          id: '2',
          userId: 'user-1',
          value: MoodValue.Neutral,
          createdAt: new Date('2025-01-08'),
          updatedAt: new Date('2025-01-08'),
          synced: true,
        },
      ];

      mockWellnessService.getRecentMoods.mockResolvedValue(mockMoods);

      await act(async () => {
        await result.current.loadRecentMoods();
      });

      expect(result.current.recentMoods).toEqual(mockMoods);
      expect(result.current.isLoading).toBe(false);
    });

    it('should calculate streak days', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockMoods: MoodEntry[] = [
        {
          id: '1',
          userId: 'user-1',
          value: MoodValue.Good,
          createdAt: today,
          updatedAt: today,
          synced: true,
        },
        {
          id: '2',
          userId: 'user-1',
          value: MoodValue.Neutral,
          createdAt: yesterday,
          updatedAt: yesterday,
          synced: true,
        },
        {
          id: '3',
          userId: 'user-1',
          value: MoodValue.Low,
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo,
          synced: true,
        },
      ];

      mockWellnessService.getRecentMoods.mockResolvedValue(mockMoods);
      mockWellnessService.calculateStreak.mockReturnValue(3);

      await act(async () => {
        await result.current.loadRecentMoods();
      });

      expect(result.current.streakDays).toBe(3);
    });
  });

  describe('calculateTrends', () => {
    it('should calculate weekly trend', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const mockTrend = {
        period: 'week' as const,
        average: 3.2,
        entries: [],
        lowestDay: new Date('2025-01-05'),
        highestDay: new Date('2025-01-09'),
        improvementRate: 10,
      };

      mockWellnessService.calculateTrend.mockResolvedValue(mockTrend);

      await act(async () => {
        await result.current.calculateTrends('week');
      });

      expect(result.current.trends.week).toEqual(mockTrend);
      expect(mockWellnessService.calculateTrend).toHaveBeenCalledWith('week');
    });

    it('should calculate monthly trend', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const mockTrend = {
        period: 'month' as const,
        average: 3.5,
        entries: [],
        lowestDay: new Date('2025-01-01'),
        highestDay: new Date('2025-01-09'),
        improvementRate: 25,
      };

      mockWellnessService.calculateTrend.mockResolvedValue(mockTrend);

      await act(async () => {
        await result.current.calculateTrends('month');
      });

      expect(result.current.trends.month).toEqual(mockTrend);
    });
  });

  describe('detectCrisisKeywords', () => {
    it('should detect critical severity keywords', () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const text = 'I want to end it all';
      
      act(() => {
        const detection = result.current.detectCrisisKeywords(text);
        
        expect(detection.detected).toBe(true);
        expect(detection.severity).toBe('critical');
        expect(detection.matchedKeywords).toContain('end it all');
        expect(detection.suggestedActions).toContain('Contact 988 Suicide & Crisis Lifeline');
      });
    });

    it('should detect high severity keywords', () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const text = 'Everything feels hopeless and worthless';
      
      act(() => {
        const detection = result.current.detectCrisisKeywords(text);
        
        expect(detection.detected).toBe(true);
        expect(detection.severity).toBe('high');
        expect(detection.matchedKeywords).toContain('hopeless');
        expect(detection.matchedKeywords).toContain('worthless');
      });
    });

    it('should detect medium severity keywords', () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const text = 'Feeling very anxious and depressed';
      
      act(() => {
        const detection = result.current.detectCrisisKeywords(text);
        
        expect(detection.detected).toBe(true);
        expect(detection.severity).toBe('medium');
        expect(detection.matchedKeywords).toContain('anxious');
        expect(detection.matchedKeywords).toContain('depressed');
      });
    });

    it('should not detect keywords in normal text', () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const text = 'Had a good day, feeling positive about tomorrow';
      
      act(() => {
        const detection = result.current.detectCrisisKeywords(text);
        
        expect(detection.detected).toBe(false);
        expect(detection.matchedKeywords).toHaveLength(0);
      });
    });

    it('should handle empty text', () => {
      const { result } = renderHook(() => useWellnessStore());
      
      act(() => {
        const detection = result.current.detectCrisisKeywords('');
        
        expect(detection.detected).toBe(false);
        expect(detection.matchedKeywords).toHaveLength(0);
      });
    });

    it('should prioritize highest severity when multiple keywords match', () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const text = 'Feeling sad and hopeless, thinking about suicide';
      
      act(() => {
        const detection = result.current.detectCrisisKeywords(text);
        
        expect(detection.detected).toBe(true);
        expect(detection.severity).toBe('critical'); // Should be critical, not low or high
        expect(detection.matchedKeywords).toContain('suicide');
      });
    });
  });

  describe('persistence', () => {
    it('should persist mood entries to AsyncStorage', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      const moodData = { value: MoodValue.Good };
      const mockEntry: MoodEntry = {
        id: 'mock-id',
        userId: 'user-1',
        value: MoodValue.Good,
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false,
      };

      mockWellnessService.saveMoodEntry.mockResolvedValue(mockEntry);

      await act(async () => {
        await result.current.addMoodEntry(moodData);
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/wellness_current_mood',
        expect.any(String)
      );
    });

    it('should load persisted state on initialization', async () => {
      // First ensure store is clean
      useWellnessStore.setState({
        currentMood: null,
        recentMoods: [],
        trends: {},
        lastCheckInDate: undefined,
        streakDays: 0,
        isLoading: false,
        error: null,
        lastSync: undefined,
      });

      const persistedMood = {
        id: 'persisted-id',
        userId: 'user-1',
        value: MoodValue.Neutral, // Use the enum value
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: true,
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(persistedMood));

      const { result } = renderHook(() => useWellnessStore());
      
      await act(async () => {
        await result.current.loadPersistedState();
      });

      expect(result.current.currentMood).toBeTruthy();
      expect(result.current.currentMood?.value).toBe(MoodValue.Neutral);
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useWellnessStore());
      
      act(() => {
        // Set an error
        result.current.error = 'Test error';
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', async () => {
      const { result } = renderHook(() => useWellnessStore());
      
      // Add some data
      const mockEntry: MoodEntry = {
        id: 'mock-id',
        userId: 'user-1',
        value: MoodValue.Good,
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false,
      };

      mockWellnessService.saveMoodEntry.mockResolvedValue(mockEntry);

      await act(async () => {
        await result.current.addMoodEntry({ value: MoodValue.Good });
      });

      expect(result.current.currentMood).toBeTruthy();
      expect(result.current.recentMoods.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.currentMood).toBeNull();
      expect(result.current.recentMoods).toHaveLength(0);
      expect(result.current.trends).toEqual({});
      expect(result.current.streakDays).toBe(0);
    });
  });
});