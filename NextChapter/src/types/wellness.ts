// Mood tracking types
export enum MoodValue {
  VeryLow = 1,
  Low = 2,
  Neutral = 3,
  Good = 4,
  VeryGood = 5,
}

export interface MoodEntry {
  id: string;
  userId: string;
  value: MoodValue;
  note?: string;
  triggers?: string[];
  activities?: string[];
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface MoodTrend {
  period: 'week' | 'month' | 'quarter';
  average: number;
  entries: MoodEntry[];
  lowestDay: Date;
  highestDay: Date;
  improvementRate: number; // Percentage change
}

export interface CrisisKeyword {
  keyword: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchType: 'exact' | 'contains' | 'regex';
}

export interface CrisisDetectionResult {
  detected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchedKeywords: string[];
  suggestedActions: string[];
}

export interface WellnessState {
  currentMood: MoodEntry | null;
  recentMoods: MoodEntry[];
  trends: {
    week?: MoodTrend;
    month?: MoodTrend;
  };
  lastCheckInDate?: Date;
  streakDays: number;
  isLoading: boolean;
  error: string | null;
}

// Common mood descriptors for UI
export const MOOD_DESCRIPTORS: Record<MoodValue, string> = {
  [MoodValue.VeryLow]: 'Very Low',
  [MoodValue.Low]: 'Low',
  [MoodValue.Neutral]: 'Neutral',
  [MoodValue.Good]: 'Good',
  [MoodValue.VeryGood]: 'Very Good',
};

// Common mood emojis for visual representation
export const MOOD_EMOJIS: Record<MoodValue, string> = {
  [MoodValue.VeryLow]: '😔',
  [MoodValue.Low]: '😕',
  [MoodValue.Neutral]: '😐',
  [MoodValue.Good]: '🙂',
  [MoodValue.VeryGood]: '😊',
};

// Crisis intervention keywords
export const CRISIS_KEYWORDS: CrisisKeyword[] = [
  // Critical severity - immediate intervention
  { keyword: 'suicide', severity: 'critical', matchType: 'contains' },
  { keyword: 'kill myself', severity: 'critical', matchType: 'contains' },
  { keyword: 'end it all', severity: 'critical', matchType: 'contains' },
  { keyword: 'not worth living', severity: 'critical', matchType: 'contains' },
  { keyword: 'better off dead', severity: 'critical', matchType: 'contains' },
  
  // High severity - strong intervention
  { keyword: 'hopeless', severity: 'high', matchType: 'contains' },
  { keyword: 'worthless', severity: 'high', matchType: 'contains' },
  { keyword: 'can\'t go on', severity: 'high', matchType: 'contains' },
  { keyword: 'giving up', severity: 'high', matchType: 'contains' },
  
  // Medium severity - moderate support
  { keyword: 'depressed', severity: 'medium', matchType: 'contains' },
  { keyword: 'anxious', severity: 'medium', matchType: 'contains' },
  { keyword: 'panic', severity: 'medium', matchType: 'contains' },
  { keyword: 'scared', severity: 'medium', matchType: 'contains' },
  
  // Low severity - gentle support
  { keyword: 'sad', severity: 'low', matchType: 'contains' },
  { keyword: 'lonely', severity: 'low', matchType: 'contains' },
  { keyword: 'frustrated', severity: 'low', matchType: 'contains' },
  { keyword: 'stressed', severity: 'low', matchType: 'contains' },
];