import { StateCreator } from 'zustand';
import { 
  MoodStore, 
  MoodStoreState,
  MoodEntry,
  MoodInsight,
  MoodStatistics,
  MoodLevel,
  MoodCategory 
} from '@stores/interfaces/moodStore';
import { createStore, createInitialState, handleAsyncOperation } from '@stores/factory/createStore';

/**
 * Crisis keywords that trigger resource display
 */
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'not worth living', 
  'better off dead', 'no point', 'give up', 'can\'t go on'
];

/**
 * Crisis resources
 */
const CRISIS_RESOURCES = [
  {
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    url: 'https://988lifeline.org',
    description: '24/7, free and confidential support',
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    url: 'https://www.crisistextline.org',
    description: 'Free, 24/7 text support',
  },
  {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    url: 'https://www.samhsa.gov/find-help/national-helpline',
    description: 'Treatment referral and information service',
  },
];

/**
 * Initial state for mood store
 */
const initialState = createInitialState<Omit<MoodStoreState, 'isLoading' | 'error'>>({
  entries: [],
  todaysEntry: null,
  insights: [],
  statistics: null,
  isAnalyzing: false,
  showCrisisResources: false,
  reminderEnabled: false,
  reminderTime: null,
});

/**
 * Mood CRUD operations implementation
 */
const createMoodCrudOperations: StateCreator<MoodStore, [], [], Pick<MoodStore,
  'loadMoodHistory' | 'addMoodEntry' | 'updateMoodEntry' | 'deleteMoodEntry'
>> = (set, get) => ({
  loadMoodHistory: async () => {
    await handleAsyncOperation(
      set,
      async () => {
        // TODO: Load from actual database
        // For now, return empty array
        const entries: MoodEntry[] = [];
        
        // Check if there's an entry for today
        const today = new Date().toDateString();
        const todaysEntry = entries.find(e => 
          new Date(e.date).toDateString() === today
        );
        
        set({ 
          entries,
          todaysEntry: todaysEntry || null,
        });
        
        // Generate insights after loading
        get().generateInsights();
        
        return entries;
      },
      {
        onError: (error) => {
          console.error('Error loading mood history:', error);
        }
      }
    );
  },

  addMoodEntry: async (entry) => {
    await handleAsyncOperation(
      set,
      async () => {
        const newEntry: MoodEntry = {
          ...entry,
          id: `mood_${Date.now()}`,
          createdAt: new Date(),
        };
        
        // Check for crisis indicators
        if (get().checkForCrisisIndicators(newEntry)) {
          set({ showCrisisResources: true });
        }
        
        set((state) => ({
          entries: [newEntry, ...state.entries],
          todaysEntry: newEntry,
        }));
        
        // Regenerate insights
        get().generateInsights();
        
        return newEntry;
      },
      {
        onError: (error) => {
          console.error('Error adding mood entry:', error);
          throw error;
        }
      }
    );
  },

  updateMoodEntry: async (id, updates) => {
    await handleAsyncOperation(
      set,
      async () => {
        set((state) => ({
          entries: state.entries.map(entry =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        }));
        
        // Regenerate insights
        get().generateInsights();
      },
      {
        onError: (error) => {
          console.error('Error updating mood entry:', error);
          throw error;
        }
      }
    );
  },

  deleteMoodEntry: async (id) => {
    await handleAsyncOperation(
      set,
      async () => {
        set((state) => ({
          entries: state.entries.filter(entry => entry.id !== id),
          todaysEntry: state.todaysEntry?.id === id ? null : state.todaysEntry,
        }));
        
        // Regenerate insights
        get().generateInsights();
      },
      {
        onError: (error) => {
          console.error('Error deleting mood entry:', error);
          throw error;
        }
      }
    );
  },
});

/**
 * Mood analytics operations implementation
 */
const createMoodAnalyticsOperations: StateCreator<MoodStore, [], [], Pick<MoodStore,
  'getMoodStatistics' | 'getMoodTrend' | 'generateInsights' | 'detectPatterns'
>> = (set, get) => ({
  getMoodStatistics: (days = 30) => {
    const entries = get().entries;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentEntries = entries.filter(e => 
      new Date(e.date) >= cutoffDate
    );
    
    if (recentEntries.length === 0) {
      return {
        averageMood: 0,
        moodTrend: 'stable',
        mostFrequentCategories: [],
        streakDays: 0,
        totalEntries: 0,
      };
    }
    
    // Calculate average mood
    const averageMood = recentEntries.reduce((sum, e) => sum + e.level, 0) / recentEntries.length;
    
    // Calculate trend (simplified)
    const firstHalf = recentEntries.slice(0, Math.floor(recentEntries.length / 2));
    const secondHalf = recentEntries.slice(Math.floor(recentEntries.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.level, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.level, 0) / secondHalf.length;
    
    let moodTrend: 'improving' | 'stable' | 'declining';
    if (secondAvg > firstAvg + 0.5) moodTrend = 'improving';
    else if (secondAvg < firstAvg - 0.5) moodTrend = 'declining';
    else moodTrend = 'stable';
    
    // Calculate most frequent categories
    const categoryCount: Record<MoodCategory, number> = {} as any;
    recentEntries.forEach(entry => {
      entry.categories.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    
    const mostFrequentCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat as MoodCategory);
    
    // Calculate streak (consecutive days with entries)
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasEntry = entries.some(e => 
        new Date(e.date).toDateString() === checkDate.toDateString()
      );
      if (hasEntry) streakDays++;
      else break;
    }
    
    return {
      averageMood,
      moodTrend,
      mostFrequentCategories,
      streakDays,
      totalEntries: recentEntries.length,
    };
  },

  getMoodTrend: (days = 7) => {
    const entries = get().entries;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const trend: Array<{ date: Date; average: number }> = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const dayEntries = entries.filter(e => 
        new Date(e.date).toDateString() === dateStr
      );
      
      if (dayEntries.length > 0) {
        const average = dayEntries.reduce((sum, e) => sum + e.level, 0) / dayEntries.length;
        trend.unshift({ date, average });
      }
    }
    
    return trend;
  },

  generateInsights: () => {
    set({ isAnalyzing: true });
    
    const stats = get().getMoodStatistics();
    const insights: MoodInsight[] = [];
    
    // Trend insight
    if (stats.moodTrend === 'improving') {
      insights.push({
        type: 'trend',
        title: 'Your mood is trending upward',
        description: 'Keep up the great work! Your recent entries show improvement.',
        severity: 'positive',
        actionable: false,
      });
    } else if (stats.moodTrend === 'declining') {
      insights.push({
        type: 'trend',
        title: 'Your mood has been lower lately',
        description: 'Consider reaching out to your support network or trying a new coping strategy.',
        severity: 'concerning',
        actionable: true,
        actions: [
          {
            label: 'Talk to Coach',
            action: () => {
              // Navigate to coach screen
            },
          },
        ],
      });
    }
    
    // Streak insight
    if (stats.streakDays >= 7) {
      insights.push({
        type: 'pattern',
        title: `${stats.streakDays} day tracking streak!`,
        description: 'Consistent tracking helps you understand your patterns better.',
        severity: 'positive',
        actionable: false,
      });
    }
    
    // Category insights
    if (stats.mostFrequentCategories.includes('anxious')) {
      insights.push({
        type: 'recommendation',
        title: 'Managing anxiety',
        description: 'You\'ve been feeling anxious lately. Try some breathing exercises or meditation.',
        severity: 'neutral',
        actionable: true,
        actions: [
          {
            label: 'Breathing Exercise',
            action: () => {
              // Navigate to breathing exercise
            },
          },
        ],
      });
    }
    
    set({ 
      insights,
      isAnalyzing: false,
      statistics: stats,
    });
  },

  detectPatterns: () => {
    const entries = get().entries;
    const patterns: Array<{
      pattern: string;
      frequency: number;
      impact: 'positive' | 'negative';
    }> = [];
    
    // Simple pattern detection (can be enhanced)
    // Pattern: Low mood on Mondays
    const mondayEntries = entries.filter(e => 
      new Date(e.date).getDay() === 1
    );
    if (mondayEntries.length >= 3) {
      const mondayAvg = mondayEntries.reduce((sum, e) => sum + e.level, 0) / mondayEntries.length;
      if (mondayAvg < 3) {
        patterns.push({
          pattern: 'Low mood on Mondays',
          frequency: mondayEntries.length,
          impact: 'negative',
        });
      }
    }
    
    // Pattern: Better mood after activities
    const activeEntries = entries.filter(e => 
      e.activities && e.activities.includes('exercise')
    );
    if (activeEntries.length >= 5) {
      const activeAvg = activeEntries.reduce((sum, e) => sum + e.level, 0) / activeEntries.length;
      if (activeAvg >= 4) {
        patterns.push({
          pattern: 'Exercise improves mood',
          frequency: activeEntries.length,
          impact: 'positive',
        });
      }
    }
    
    return patterns;
  },
});

/**
 * Mood reminder operations implementation
 */
const createMoodReminderOperations: StateCreator<MoodStore, [], [], Pick<MoodStore,
  'setDailyReminder' | 'disableReminder' | 'getReminderStatus'
>> = (set, get) => ({
  setDailyReminder: async (time) => {
    // TODO: Implement actual push notification scheduling
    set({ 
      reminderEnabled: true,
      reminderTime: time,
    });
  },

  disableReminder: async () => {
    // TODO: Cancel push notifications
    set({ 
      reminderEnabled: false,
      reminderTime: null,
    });
  },

  getReminderStatus: () => {
    const { reminderEnabled, reminderTime } = get();
    return { 
      enabled: reminderEnabled, 
      time: reminderTime || undefined,
    };
  },
});

/**
 * Crisis detection operations implementation
 */
const createCrisisDetectionOperations: StateCreator<MoodStore, [], [], Pick<MoodStore,
  'checkForCrisisIndicators' | 'getCrisisResources' | 'trackCrisisIntervention'
>> = (set, get) => ({
  checkForCrisisIndicators: (entry) => {
    // Check mood level
    if (entry.level === 1) {
      return true;
    }
    
    // Check notes for crisis keywords
    if (entry.notes) {
      const lowerNotes = entry.notes.toLowerCase();
      const hasKeyword = CRISIS_KEYWORDS.some(keyword => 
        lowerNotes.includes(keyword)
      );
      if (hasKeyword) {
        return true;
      }
    }
    
    // Check categories
    if (entry.categories.includes('overwhelmed') && entry.level <= 2) {
      return true;
    }
    
    return false;
  },

  getCrisisResources: () => {
    return CRISIS_RESOURCES;
  },

  trackCrisisIntervention: () => {
    // TODO: Send analytics event
    console.log('Crisis intervention triggered');
  },
});

/**
 * Complete mood store creator
 * Combines all functionality using composition
 */
const moodStoreCreator: StateCreator<MoodStore, [], [], MoodStore> = (set, get) => ({
  ...initialState,
  ...createMoodCrudOperations(set, get, {} as any),
  ...createMoodAnalyticsOperations(set, get, {} as any),
  ...createMoodReminderOperations(set, get, {} as any),
  ...createCrisisDetectionOperations(set, get, {} as any),
  
  // Reset function
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the mood store
 * Using factory pattern for consistent configuration
 */
export const useMoodStore = createStore<MoodStore>(
  moodStoreCreator,
  {
    name: 'mood-store',
    persist: true,
    partialize: (state) => ({
      entries: state.entries.slice(-90), // Keep last 90 days
      reminderEnabled: state.reminderEnabled,
      reminderTime: state.reminderTime,
    }),
  }
);