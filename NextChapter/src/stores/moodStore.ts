import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MoodEntry {
  id: string;
  value: number; // 1-10 scale
  emotion: string;
  note?: string;
  createdAt: string;
}

interface MoodStore {
  moods: MoodEntry[];
  recentMoods: MoodEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addMood: (mood: Omit<MoodEntry, 'id' | 'createdAt'>) => void;
  getMoodsForPeriod: (days: number) => MoodEntry[];
  getAverageMood: (days: number) => number;
  clearError: () => void;
}

export const useMoodStore = create<MoodStore>()(
  devtools(
    persist(
      (set, get) => ({
        moods: [],
        recentMoods: [],
        isLoading: false,
        error: null,

        addMood: (moodData) => {
          const newMood: MoodEntry = {
            ...moodData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          };

          set((state) => {
            const updatedMoods = [newMood, ...state.moods];
            const recentMoods = updatedMoods
              .filter((mood) => {
                const daysAgo = (Date.now() - new Date(mood.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                return daysAgo <= 7;
              })
              .slice(0, 7);

            return {
              moods: updatedMoods,
              recentMoods,
            };
          });
        },

        getMoodsForPeriod: (days: number) => {
          const { moods } = get();
          const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
          
          return moods.filter((mood) => {
            const moodDate = new Date(mood.createdAt).getTime();
            return moodDate >= cutoffDate;
          });
        },

        getAverageMood: (days: number) => {
          const periodicMoods = get().getMoodsForPeriod(days);
          if (periodicMoods.length === 0) return 5; // Default neutral
          
          const sum = periodicMoods.reduce((acc, mood) => acc + mood.value, 0);
          return sum / periodicMoods.length;
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'mood-storage',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          moods: state.moods,
          recentMoods: state.recentMoods,
        }),
      }
    )
  )
);