// src/hooks/useAuth.ts
export { useAuth } from '../context/AuthContext';

// src/hooks/useOnboarding.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingData {
  layoffDate?: string;
  role?: string;
  state?: string;
  goal?: string;
  elapsedTime?: number;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const completed = await AsyncStorage.getItem(`onboarding_complete_${user.id}`);
        const data = await AsyncStorage.getItem(`onboarding_data_${user.id}`);
        
        setIsOnboardingComplete(completed === 'true');
        if (data) {
          setOnboardingData(JSON.parse(data));
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const saveOnboardingData = async (data: Partial<OnboardingData>) => {
    if (!user) return;

    const updatedData = { ...onboardingData, ...data };
    setOnboardingData(updatedData);
    
    try {
      await AsyncStorage.setItem(
        `onboarding_data_${user.id}`, 
        JSON.stringify(updatedData)
      );
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return {
    isOnboardingComplete,
    isLoading,
    onboardingData,
    saveOnboardingData,
    completeOnboarding,
  };
}

// src/hooks/useNetworkStatus.ts
export { useOffline as useNetworkStatus } from '../context/OfflineContext';

// src/services/api/supabase.ts
import { getSecurityServices } from '../security';

// Use secure Supabase client with encrypted credential storage
export const getSupabaseClient = async () => {
  const services = getSecurityServices();
  return services.supabase.getClient();
};

// For backward compatibility, export a promise that resolves to the client
export const supabase = getSupabaseClient();

// src/services/api/openai.ts
import { getSecurityServices } from '../security';

// Use secure OpenAI service with encrypted API key storage and content filtering
export const openAIService = getSecurityServices().openai;

// Re-export types for backward compatibility
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CoachResponse {
  message: string;
  tone: 'hype' | 'pragmatist' | 'tough-love';
  tokenCount: number;
}

// src/services/database/index.ts
import { Database } from '@nozbe/watermelondb';
// Note: We'll implement the SQLite adapter later when we set up the actual database
// For now, we'll just provide a placeholder

// Models (we'll create these later)
// import User from './models/User';
// import Task from './models/Task';
// import Application from './models/Application';
// import MoodEntry from './models/MoodEntry';
// import BudgetEntry from './models/BudgetEntry';
// import CoachMessage from './models/CoachMessage';

// Schema (we'll create this later)
// import schema from './schema';

export async function initializeDatabase() {
  console.log('Database initialization - WatermelonDB setup will be implemented in next phase');
  
  // TODO: Implement actual database initialization
  // We'll set this up when we create the models and schema
  // const adapter = new SQLiteAdapter({
  //   schema,
  //   dbName: 'nextchapter',
  //   jsi: true,
  // });

  // const database = new Database({
  //   adapter,
  //   modelClasses: [
  //     User,
  //     Task,
  //     Application,
  //     MoodEntry,
  //     BudgetEntry,
  //     CoachMessage,
  //   ],
  // });

  // For now, just return a resolved promise
  return Promise.resolve();
}

// src/services/notifications/pushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function initializeNotifications() {
  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
    
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return token;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
}

export async function scheduleDailyTaskNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Bounce Plan Task',
      body: 'Ready for today\'s progress step?',
      data: { type: 'daily_task' },
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}

// src/utils/analytics.ts
interface AnalyticsEvent {
  user_signed_up: { method: 'email' };
  user_signed_in: { method: 'email' };
  user_signed_out: {};
  app_initialized: {};
  task_completed: { task_id: string; day_index: number; skipped: boolean };
  coach_message_sent: { mode: 'pull'; tone?: string };
  resume_uploaded: { keywords_matched: number; suggested: number };
  application_added: { stage: 'applied' | 'interviewing' | 'offer' };
  mood_logged: { emoji: string; valence_score: number };
  budget_saved: { income: number; expenses: number; runway_months: number };
}

export function logAnalyticsEvent<T extends keyof AnalyticsEvent>(
  event: T,
  properties: AnalyticsEvent[T]
) {
  // TODO: Implement actual analytics (e.g., PostHog, Amplitude, etc.)
  console.log('Analytics Event:', event, properties);
  
  // Example implementation:
  // analytics.track(event, properties);
}

// src/utils/constants.ts
export const APP_CONFIG = {
  // Coach limits
  FREE_COACH_MESSAGES_PER_DAY: 10,
  
  // Storage limits
  MAX_LOCAL_STORAGE_MB: 25,
  MAX_CACHED_COACH_MESSAGES: 25,
  
  // Sync settings
  SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  
  // Task settings
  DEFAULT_TASK_TIME: '09:00',
  
  // Benefits deadlines (days)
  UI_FILING_DEADLINE: 30,
  COBRA_DEADLINE: 60,
  
  // App version
  VERSION: '0.1.0',
};

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

export const JOB_GOALS = [
  'Find a similar role',
  'Switch to a new industry',
  'Get promoted to senior level',
  'Start freelancing/consulting',
  'Take a career break',
  'Start my own business',
];

// src/utils/helpers.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateRunwayMonths(income: number, expenses: number, savings: number): number {
  if (expenses <= 0) return Infinity;
  return savings / expenses;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}