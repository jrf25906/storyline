import { wellnessService } from '@services/wellness/wellnessService';
import { supabase } from '@services/api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodValue, MoodEntry } from '@types';

// Mock dependencies
jest.mock('../../api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../utils/uuid', () => ({
  generateUUID: jest.fn(() => 'mock-uuid'),
}));

describe('wellnessService', () => {
  const mockSupabase = supabase as any;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveMoodEntry', () => {
    it('should save mood entry to database when online', async () => {
      const moodData = {
        value: MoodValue.Good,
        note: 'Feeling optimistic',
      };

      const mockResponse = {
        data: {
          id: 'uuid-123',
          user_id: 'user-123',
          value: MoodValue.Good,
          note: 'Feeling optimistic',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockResponse),
        }),
      } as any);

      const result = await wellnessService.saveMoodEntry(moodData);

      expect(result).toMatchObject({
        id: 'uuid-123',
        userId: 'user-123',
        value: MoodValue.Good,
        note: 'Feeling optimistic',
        synced: true,
      });
    });

    it('should save mood entry locally when offline', async () => {
      const moodData = {
        value: MoodValue.Low,
        note: 'Struggling today',
      };

      const networkError = new Error('Network error');
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(networkError),
        }),
      } as any);

      const result = await wellnessService.saveMoodEntry(moodData);

      expect(result.synced).toBe(false);
      expect(result.value).toBe(MoodValue.Low);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('@next_chapter/mood_offline_'),
        expect.any(String)
      );
    });
  });

  describe('getRecentMoods', () => {
    it('should fetch recent moods from database', async () => {
      const mockMoods = [
        {
          id: '1',
          user_id: 'user-123',
          value: MoodValue.Good,
          created_at: new Date('2025-01-09').toISOString(),
          updated_at: new Date('2025-01-09').toISOString(),
        },
        {
          id: '2',
          user_id: 'user-123',
          value: MoodValue.Neutral,
          created_at: new Date('2025-01-08').toISOString(),
          updated_at: new Date('2025-01-08').toISOString(),
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockMoods,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await wellnessService.getRecentMoods(30);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(MoodValue.Good);
      expect(result[1].value).toBe(MoodValue.Neutral);
    });

    it('should merge offline and online moods', async () => {
      const onlineMood = {
        id: '1',
        user_id: 'user-123',
        value: MoodValue.Good,
        created_at: new Date('2025-01-08').toISOString(),
        updated_at: new Date('2025-01-08').toISOString(),
      };

      const offlineMood = {
        id: 'offline-1',
        userId: 'user-123',
        value: MoodValue.Low,
        createdAt: new Date('2025-01-09').toISOString(),
        updatedAt: new Date('2025-01-09').toISOString(),
        synced: false,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [onlineMood],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      mockAsyncStorage.getAllKeys.mockResolvedValue(['@next_chapter/mood_offline_1']);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineMood));

      const result = await wellnessService.getRecentMoods(30);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(MoodValue.Low); // More recent offline mood
      expect(result[1].value).toBe(MoodValue.Good); // Older online mood
    });
  });

  describe('calculateTrend', () => {
    it('should calculate weekly mood trend', async () => {
      const weekMoods = Array.from({ length: 7 }, (_, i) => ({
        id: `${i}`,
        user_id: 'user-123',
        value: i % 2 === 0 ? MoodValue.Good : MoodValue.Neutral,
        created_at: new Date(2025, 0, 9 - i).toISOString(),
        updated_at: new Date(2025, 0, 9 - i).toISOString(),
      }));

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: weekMoods,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const trend = await wellnessService.calculateTrend('week');

      expect(trend.period).toBe('week');
      expect(trend.average).toBeCloseTo(3.5, 1); // Average of Good(4) and Neutral(3)
      expect(trend.entries).toHaveLength(7);
    });

    it('should calculate improvement rate', async () => {
      const moods = [
        // First half of week - average 2.5
        { ...createMoodEntry(MoodValue.Low), created_at: new Date(2025, 0, 3).toISOString() },
        { ...createMoodEntry(MoodValue.Neutral), created_at: new Date(2025, 0, 4).toISOString() },
        // Second half of week - average 4
        { ...createMoodEntry(MoodValue.Good), created_at: new Date(2025, 0, 7).toISOString() },
        { ...createMoodEntry(MoodValue.Good), created_at: new Date(2025, 0, 8).toISOString() },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: moods,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const trend = await wellnessService.calculateTrend('week');

      expect(trend.improvementRate).toBeGreaterThan(0); // Should show improvement
    });
  });

  describe('calculateStreak', () => {
    it('should calculate consecutive days streak', () => {
      const today = new Date();
      const moods: MoodEntry[] = [];
      
      // Create 5 consecutive days
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        moods.push({
          id: `${i}`,
          userId: 'user-123',
          value: MoodValue.Good,
          createdAt: date,
          updatedAt: date,
          synced: true,
        });
      }

      const streak = wellnessService.calculateStreak(moods);
      expect(streak).toBe(5);
    });

    it('should return 0 for broken streak', () => {
      const today = new Date();
      const moods: MoodEntry[] = [
        {
          id: '1',
          userId: 'user-123',
          value: MoodValue.Good,
          createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          updatedAt: new Date(),
          synced: true,
        },
      ];

      const streak = wellnessService.calculateStreak(moods);
      expect(streak).toBe(0);
    });

    it('should handle empty mood list', () => {
      const streak = wellnessService.calculateStreak([]);
      expect(streak).toBe(0);
    });
  });

  describe('syncOfflineMoods', () => {
    it('should sync offline moods when connection is restored', async () => {
      const offlineMood = {
        id: 'offline-1',
        userId: 'user-123',
        value: MoodValue.Good,
        note: 'Offline entry',
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false,
      };

      mockAsyncStorage.getAllKeys.mockResolvedValue(['@next_chapter/mood_offline_1']);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineMood));

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...offlineMood, id: 'synced-1' },
            error: null,
          }),
        }),
      } as any);

      const syncedCount = await wellnessService.syncOfflineMoods();

      expect(syncedCount).toBe(1);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@next_chapter/mood_offline_1');
    });

    it('should handle sync failures gracefully', async () => {
      const offlineMood = {
        id: 'offline-1',
        userId: 'user-123',
        value: MoodValue.Good,
        synced: false,
      };

      mockAsyncStorage.getAllKeys.mockResolvedValue(['@next_chapter/mood_offline_1']);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineMood));

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Sync failed')),
        }),
      } as any);

      const syncedCount = await wellnessService.syncOfflineMoods();

      expect(syncedCount).toBe(0);
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('exportMoodData', () => {
    it('should export mood data in specified format', async () => {
      const moods = [
        createMoodEntry(MoodValue.Good, 'Great day'),
        createMoodEntry(MoodValue.Low, 'Tough day'),
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: moods,
              error: null,
            }),
          }),
        }),
      } as any);

      const exportData = await wellnessService.exportMoodData('json');

      expect(exportData).toContain('"value":4');
      expect(exportData).toContain('"note":"Great day"');
    });
  });
});

// Helper function
function createMoodEntry(value: MoodValue, note?: string): any {
  return {
    id: `${Math.random()}`,
    user_id: 'user-123',
    value,
    note,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}