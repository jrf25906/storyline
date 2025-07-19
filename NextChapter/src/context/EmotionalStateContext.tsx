import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useJobApplicationStore } from '@stores/jobApplicationStore';
import { useMoodStore } from '@stores/moodStore';

export type EmotionalState = 'normal' | 'crisis' | 'success' | 'struggling';

interface EmotionalStateContextType {
  emotionalState: EmotionalState;
  setEmotionalState: (state: EmotionalState) => void;
  autoDetectedState: EmotionalState;
  isAutoDetectionEnabled: boolean;
  setAutoDetectionEnabled: (enabled: boolean) => void;
  stressLevel: number; // 0-10 scale
  recentAchievements: string[];
}

const EmotionalStateContext = createContext<EmotionalStateContextType | undefined>(undefined);

const STORAGE_KEY = '@next_chapter/emotional_state';
const AUTO_DETECTION_KEY = '@next_chapter/auto_detection_enabled';

interface EmotionalStateProviderProps {
  children: ReactNode;
}

export function EmotionalStateProvider({ children }: EmotionalStateProviderProps) {
  const [emotionalState, setEmotionalStateInternal] = useState<EmotionalState>('normal');
  const [isAutoDetectionEnabled, setAutoDetectionEnabledInternal] = useState(true);
  const [autoDetectedState, setAutoDetectedState] = useState<EmotionalState>('normal');
  const [stressLevel, setStressLevel] = useState(5);
  const [recentAchievements, setRecentAchievements] = useState<string[]>([]);

  // Get store data for detection
  const bouncePlanStore = useBouncePlanStore();
  const jobApplicationStore = useJobApplicationStore();
  const moodStore = useMoodStore();

  // Load saved state
  useEffect(() => {
    const loadState = async () => {
      try {
        const [savedState, savedAutoDetection] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(AUTO_DETECTION_KEY),
        ]);

        if (savedState) {
          setEmotionalStateInternal(savedState as EmotionalState);
        }
        if (savedAutoDetection !== null) {
          setAutoDetectionEnabledInternal(savedAutoDetection === 'true');
        }
      } catch (error) {
        console.error('Error loading emotional state:', error);
      }
    };
    loadState();
  }, []);

  // Auto-detect emotional state based on user activity
  useEffect(() => {
    if (!isAutoDetectionEnabled) return;

    const detectState = () => {
      const achievements: string[] = [];
      let detectedState: EmotionalState = 'normal';
      let detectedStressLevel = 5;

      // Check task completion rate (last 7 days)
      const recentTasks = Object.values(bouncePlanStore.localProgress || {})
        .filter(task => {
          if (!task.completedAt) return false;
          const daysAgo = (Date.now() - new Date(task.completedAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 7;
        });
      
      const completionRate = recentTasks.length / 7; // Assuming 1 task per day

      // Check job application activity
      const recentApplications = jobApplicationStore.applications.filter(app => {
        const daysAgo = (Date.now() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      });

      const interviews = jobApplicationStore.applications.filter(
        app => app.status === 'interviewing'
      ).length;

      const offers = jobApplicationStore.applications.filter(
        app => app.status === 'offer'
      ).length;

      // Check mood trends (if mood tracking is implemented)
      const recentMoods = moodStore?.recentMoods || [];
      const avgMood = recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => sum + m.value, 0) / recentMoods.length
        : 5;

      // Detect Success Mode
      if (offers > 0) {
        detectedState = 'success';
        detectedStressLevel = 2;
        achievements.push('Received job offer! 🎉');
      } else if (interviews >= 3) {
        detectedState = 'success';
        detectedStressLevel = 3;
        achievements.push(`${interviews} interviews scheduled!`);
      } else if (completionRate >= 0.8 && recentApplications.length >= 5) {
        detectedState = 'success';
        detectedStressLevel = 4;
        achievements.push('Great progress this week!');
      }
      // Detect Crisis Mode
      else if (completionRate < 0.2 && recentApplications.length === 0) {
        detectedState = 'crisis';
        detectedStressLevel = 9;
      } else if (avgMood < 3 && avgMood > 0) {
        detectedState = 'crisis';
        detectedStressLevel = 8;
      }
      // Detect Struggling Mode
      else if (completionRate < 0.5 || recentApplications.length < 2) {
        detectedState = 'struggling';
        detectedStressLevel = 7;
      }
      // Normal Mode
      else {
        detectedState = 'normal';
        detectedStressLevel = 5;
      }

      setAutoDetectedState(detectedState);
      setStressLevel(detectedStressLevel);
      setRecentAchievements(achievements);

      // Auto-apply detected state if significantly different
      if (isAutoDetectionEnabled && detectedState !== emotionalState) {
        if (detectedState === 'crisis' || detectedState === 'success') {
          setEmotionalStateInternal(detectedState);
        }
      }
    };

    detectState();
    const interval = setInterval(detectState, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [
    isAutoDetectionEnabled,
    emotionalState,
    bouncePlanStore.localProgress,
    jobApplicationStore.applications,
    moodStore?.recentMoods,
  ]);

  // Save state changes
  const setEmotionalState = async (state: EmotionalState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, state);
      setEmotionalStateInternal(state);
    } catch (error) {
      console.error('Error saving emotional state:', error);
    }
  };

  const setAutoDetectionEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(AUTO_DETECTION_KEY, enabled.toString());
      setAutoDetectionEnabledInternal(enabled);
    } catch (error) {
      console.error('Error saving auto detection preference:', error);
    }
  };

  return (
    <EmotionalStateContext.Provider
      value={{
        emotionalState,
        setEmotionalState,
        autoDetectedState,
        isAutoDetectionEnabled,
        setAutoDetectionEnabled,
        stressLevel,
        recentAchievements,
      }}
    >
      {children}
    </EmotionalStateContext.Provider>
  );
}

export function useEmotionalState() {
  const context = useContext(EmotionalStateContext);
  if (!context) {
    throw new Error('useEmotionalState must be used within EmotionalStateProvider');
  }
  return context;
}