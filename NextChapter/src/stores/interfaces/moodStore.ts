import { BaseStore, BaseState, AsyncResult } from '@stores/interfaces/base';

/**
 * Mood level types
 */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Mood category types
 */
export type MoodCategory = 'anxious' | 'hopeful' | 'frustrated' | 'motivated' | 'overwhelmed' | 'confident';

/**
 * Mood entry interface
 */
export interface MoodEntry {
  id: string;
  date: Date;
  level: MoodLevel;
  categories: MoodCategory[];
  notes?: string;
  triggers?: string[];
  activities?: string[];
  createdAt: Date;
}

/**
 * Mood insight interface
 */
export interface MoodInsight {
  type: 'trend' | 'pattern' | 'trigger' | 'recommendation';
  title: string;
  description: string;
  severity: 'positive' | 'neutral' | 'concerning';
  actionable?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

/**
 * Mood statistics interface
 */
export interface MoodStatistics {
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  mostFrequentCategories: MoodCategory[];
  streakDays: number;
  totalEntries: number;
}

/**
 * Mood CRUD operations interface
 */
export interface MoodCrudOperations {
  loadMoodHistory: () => AsyncResult;
  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => AsyncResult;
  updateMoodEntry: (id: string, updates: Partial<MoodEntry>) => AsyncResult;
  deleteMoodEntry: (id: string) => AsyncResult;
}

/**
 * Mood analytics operations interface
 */
export interface MoodAnalyticsOperations {
  getMoodStatistics: (days?: number) => MoodStatistics;
  getMoodTrend: (days?: number) => Array<{ date: Date; average: number }>;
  generateInsights: () => MoodInsight[];
  detectPatterns: () => Array<{
    pattern: string;
    frequency: number;
    impact: 'positive' | 'negative';
  }>;
}

/**
 * Mood reminder operations interface
 */
export interface MoodReminderOperations {
  setDailyReminder: (time: string) => AsyncResult;
  disableReminder: () => AsyncResult;
  getReminderStatus: () => { enabled: boolean; time?: string };
}

/**
 * Crisis detection operations interface
 */
export interface CrisisDetectionOperations {
  checkForCrisisIndicators: (entry: MoodEntry) => boolean;
  getCrisisResources: () => Array<{
    name: string;
    phone?: string;
    url?: string;
    description: string;
  }>;
  trackCrisisIntervention: () => void;
}

/**
 * Mood store state interface
 */
export interface MoodStoreState extends BaseState {
  // Core data
  entries: MoodEntry[];
  todaysEntry: MoodEntry | null;
  
  // Analytics
  insights: MoodInsight[];
  statistics: MoodStatistics | null;
  
  // UI state
  isAnalyzing: boolean;
  showCrisisResources: boolean;
  
  // Reminder state
  reminderEnabled: boolean;
  reminderTime: string | null;
}

/**
 * Complete mood store interface
 * Combines all mood tracking functionality
 */
export interface MoodStore extends 
  BaseStore,
  MoodStoreState,
  MoodCrudOperations,
  MoodAnalyticsOperations,
  MoodReminderOperations,
  CrisisDetectionOperations {}