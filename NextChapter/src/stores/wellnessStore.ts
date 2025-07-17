import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  WellnessState, 
  MoodEntry, 
  MoodValue, 
  CrisisDetectionResult,
  CRISIS_KEYWORDS,
  MoodTrend 
} from '../types';
import { wellnessService } from '../services/wellness/wellnessService';

interface WellnessStore extends WellnessState {
  // Actions
  addMoodEntry: (data: { value: MoodValue; note?: string }) => Promise<void>;
  loadRecentMoods: () => Promise<void>;
  calculateTrends: (period: 'week' | 'month') => Promise<void>;
  detectCrisisKeywords: (text: string) => CrisisDetectionResult;
  clearError: () => void;
  reset: () => void;
  loadPersistedState: () => Promise<void>;
  
  // Sync-related actions
  hasPendingSyncs: () => boolean;
  getSyncStatus: () => { pendingOperations: number; lastSync?: Date };
  getPendingSyncMoods: () => MoodEntry[];
  syncMoodEntries: (moods: MoodEntry[], userId: string) => Promise<{ success: boolean; synced: number; errors: string[] }>;
  getOfflineQueue: () => any[];
  lastSync?: Date;
}

const initialState: WellnessState = {
  currentMood: null,
  recentMoods: [],
  trends: {},
  lastCheckInDate: undefined,
  streakDays: 0,
  isLoading: false,
  error: null,
};

export const useWellnessStore = create<WellnessStore>((set, get) => ({
  ...initialState,
  lastSync: undefined,

  addMoodEntry: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const entry = await wellnessService.saveMoodEntry(data);
      
      const recentMoods = [entry, ...get().recentMoods].slice(0, 30);
      
      set({ 
        currentMood: entry,
        recentMoods,
        lastCheckInDate: entry.createdAt,
        isLoading: false,
      });

      // Persist to AsyncStorage
      await AsyncStorage.setItem(
        '@next_chapter/wellness_current_mood',
        JSON.stringify(entry)
      );

      // Recalculate streak
      const streak = wellnessService.calculateStreak(recentMoods);
      set({ streakDays: streak });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save mood';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadRecentMoods: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const moods = await wellnessService.getRecentMoods(30);
      const streak = wellnessService.calculateStreak(moods);
      
      set({ 
        recentMoods: moods,
        streakDays: streak,
        isLoading: false,
      });

      if (moods.length > 0) {
        set({ 
          currentMood: moods[0],
          lastCheckInDate: moods[0].createdAt,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load moods';
      set({ error: errorMessage, isLoading: false });
    }
  },

  calculateTrends: async (period) => {
    set({ isLoading: true, error: null });
    
    try {
      const trend = await wellnessService.calculateTrend(period);
      
      set((state) => ({
        trends: {
          ...state.trends,
          [period]: trend,
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate trends';
      set({ error: errorMessage, isLoading: false });
    }
  },

  detectCrisisKeywords: (text: string): CrisisDetectionResult => {
    if (!text || text.trim() === '') {
      return {
        detected: false,
        severity: 'low',
        matchedKeywords: [],
        suggestedActions: [],
      };
    }

    const lowerText = text.toLowerCase();
    const matchedKeywords: string[] = [];
    let highestSeverity: CrisisDetectionResult['severity'] = 'low';
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };

    // Check each keyword
    for (const keywordConfig of CRISIS_KEYWORDS) {
      let matched = false;
      
      if (keywordConfig.matchType === 'exact') {
        matched = lowerText === keywordConfig.keyword.toLowerCase();
      } else if (keywordConfig.matchType === 'contains') {
        matched = lowerText.includes(keywordConfig.keyword.toLowerCase());
      } else if (keywordConfig.matchType === 'regex') {
        const regex = new RegExp(keywordConfig.keyword, 'i');
        matched = regex.test(text);
      }

      if (matched) {
        matchedKeywords.push(keywordConfig.keyword);
        if (severityOrder[keywordConfig.severity] > severityOrder[highestSeverity]) {
          highestSeverity = keywordConfig.severity;
        }
      }
    }

    if (matchedKeywords.length === 0) {
      return {
        detected: false,
        severity: 'low',
        matchedKeywords: [],
        suggestedActions: [],
      };
    }

    // Generate suggested actions based on severity
    const suggestedActions: string[] = [];
    
    if (highestSeverity === 'critical') {
      suggestedActions.push(
        'Contact 988 Suicide & Crisis Lifeline',
        'Talk to someone now',
        'Go to nearest emergency room if in immediate danger'
      );
    } else if (highestSeverity === 'high') {
      suggestedActions.push(
        'Talk to a counselor',
        'Reach out to a friend',
        'Use AI Coach',
        'Call a mental health hotline'
      );
    } else if (highestSeverity === 'medium') {
      suggestedActions.push(
        'Try breathing exercises',
        'Talk to AI Coach',
        'Journal your thoughts',
        'Take a break'
      );
    } else {
      suggestedActions.push(
        'Take a walk',
        'Listen to music',
        'Call a friend',
        'Practice self-care'
      );
    }

    return {
      detected: true,
      severity: highestSeverity,
      matchedKeywords: [...new Set(matchedKeywords)], // Remove duplicates
      suggestedActions,
    };
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({ ...initialState });
  },

  loadPersistedState: async () => {
    try {
      const persistedMood = await AsyncStorage.getItem('@next_chapter/wellness_current_mood');
      
      if (persistedMood) {
        const mood = JSON.parse(persistedMood);
        // Convert date strings back to Date objects
        mood.createdAt = new Date(mood.createdAt);
        mood.updatedAt = new Date(mood.updatedAt);
        
        set({ 
          currentMood: mood,
          lastCheckInDate: mood.createdAt,
        });
      }

      // Load recent moods
      await get().loadRecentMoods();
    } catch (error) {
      console.error('Failed to load persisted wellness state:', error);
    }
  },

  // Sync-related methods
  hasPendingSyncs: () => {
    const moods = get().recentMoods;
    return moods.some(mood => (mood as any)._syncStatus === 'pending');
  },

  getSyncStatus: () => {
    const moods = get().recentMoods;
    const pendingCount = moods.filter(mood => (mood as any)._syncStatus === 'pending').length;
    
    return {
      pendingOperations: pendingCount,
      lastSync: get().lastSync
    };
  },

  getPendingSyncMoods: () => {
    return get().recentMoods.filter(mood => (mood as any)._syncStatus === 'pending');
  },

  syncMoodEntries: async (moods: MoodEntry[], userId: string) => {
    let synced = 0;
    const errors: string[] = [];

    try {
      for (const mood of moods) {
        const result = await wellnessService.syncMoodEntry(mood, userId);
        if (result) {
          synced++;
          // Update local mood to mark as synced
          const recentMoods = get().recentMoods.map(m => 
            m.id === mood.id ? { ...m, _syncStatus: 'synced' } : m
          );
          set({ recentMoods });
        } else {
          errors.push(`Failed to sync mood entry ${mood.id}`);
        }
      }

      if (synced > 0) {
        set({ lastSync: new Date() });
      }

      return { success: errors.length === 0, synced, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      return { success: false, synced, errors };
    }
  },

  getOfflineQueue: () => {
    const pendingMoods = get().getPendingSyncMoods();
    return pendingMoods.map(mood => ({
      id: mood.id,
      type: 'mood_entry',
      timestamp: mood.createdAt,
      data: {
        value: mood.value,
        note: mood.note
      }
    }));
  },
}));