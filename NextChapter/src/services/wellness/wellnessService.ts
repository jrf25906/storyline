import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/api/supabase';
import { MoodEntry, MoodValue, MoodTrend } from '@types';
import { generateUUID } from '@utils/uuid';

class WellnessService {
  async saveMoodEntry(data: { value: MoodValue; note?: string; triggers?: string[]; activities?: string[] }): Promise<MoodEntry> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const now = new Date();
      const entry = {
        user_id: userId,
        value: data.value,
        note: data.note || null,
        triggers: data.triggers || [],
        activities: data.activities || [],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const { data: savedEntry, error } = await supabase
        .from('mood_entries')
        .insert(entry)
        .single();

      if (error) throw error;

      return this.transformMoodEntry(savedEntry, true);
    } catch (error) {
      // Save offline if network error
      console.log('Saving mood entry offline due to error:', error);
      return this.saveMoodOffline(data);
    }
  }

  private async saveMoodOffline(data: { value: MoodValue; note?: string; triggers?: string[]; activities?: string[] }): Promise<MoodEntry> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || 'offline-user';
    
    const now = new Date();
    const offlineEntry: MoodEntry = {
      id: `offline-${generateUUID()}`,
      userId,
      value: data.value,
      note: data.note,
      triggers: data.triggers,
      activities: data.activities,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };

    const key = `@next_chapter/mood_offline_${offlineEntry.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(offlineEntry));

    return offlineEntry;
  }

  async getRecentMoods(days: number = 30): Promise<MoodEntry[]> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: onlineMoods, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get offline moods
      const offlineMoods = await this.getOfflineMoods();
      
      // Merge and sort
      const allMoods = [
        ...offlineMoods,
        ...(onlineMoods || []).map(m => this.transformMoodEntry(m, true)),
      ];

      return allMoods
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, days * 2); // Allow up to 2 entries per day
    } catch (error) {
      console.error('Error fetching moods:', error);
      // Return offline moods only
      return this.getOfflineMoods();
    }
  }

  private async getOfflineMoods(): Promise<MoodEntry[]> {
    const keys = await AsyncStorage.getAllKeys();
    const moodKeys = keys.filter(key => key.startsWith('@next_chapter/mood_offline_'));
    
    const moods: MoodEntry[] = [];
    for (const key of moodKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const mood = JSON.parse(data);
        mood.createdAt = new Date(mood.createdAt);
        mood.updatedAt = new Date(mood.updatedAt);
        moods.push(mood);
      }
    }

    return moods;
  }

  async calculateTrend(period: 'week' | 'month' | 'quarter'): Promise<MoodTrend> {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data: moods, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const entries = (moods || []).map(m => this.transformMoodEntry(m, true));
      
      if (entries.length === 0) {
        return {
          period,
          average: 0,
          entries: [],
          lowestDay: new Date(),
          highestDay: new Date(),
          improvementRate: 0,
        };
      }

      // Calculate average
      const sum = entries.reduce((acc, entry) => acc + entry.value, 0);
      const average = sum / entries.length;

      // Find lowest and highest days
      const sortedByValue = [...entries].sort((a, b) => a.value - b.value);
      const lowestDay = sortedByValue[0].createdAt;
      const highestDay = sortedByValue[sortedByValue.length - 1].createdAt;

      // Calculate improvement rate
      const firstHalfEnd = Math.floor(entries.length / 2);
      const firstHalf = entries.slice(0, firstHalfEnd);
      const secondHalf = entries.slice(firstHalfEnd);

      const firstHalfAvg = firstHalf.reduce((acc, e) => acc + e.value, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((acc, e) => acc + e.value, 0) / secondHalf.length;
      
      const improvementRate = firstHalfAvg > 0 
        ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
        : 0;

      return {
        period,
        average: Math.round(average * 10) / 10,
        entries,
        lowestDay,
        highestDay,
        improvementRate: Math.round(improvementRate),
      };
    } catch (error) {
      console.error('Error calculating trend:', error);
      return {
        period,
        average: 0,
        entries: [],
        lowestDay: new Date(),
        highestDay: new Date(),
        improvementRate: 0,
      };
    }
  }

  calculateStreak(moods: MoodEntry[]): number {
    if (moods.length === 0) return 0;

    // Sort by date descending
    const sortedMoods = [...moods].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    
    for (const mood of sortedMoods) {
      const moodDate = new Date(mood.createdAt);
      moodDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((currentDate.getTime() - moodDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (dayDiff === 1 && streak > 0) {
        streak++;
        currentDate = new Date(moodDate);
      } else {
        break;
      }
    }

    return streak;
  }

  async syncOfflineMoods(): Promise<number> {
    const offlineMoods = await this.getOfflineMoods();
    let syncedCount = 0;

    for (const mood of offlineMoods) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) continue;

        const { error } = await supabase
          .from('mood_entries')
          .insert({
            user_id: userId,
            value: mood.value,
            note: mood.note,
            triggers: mood.triggers,
            activities: mood.activities,
            created_at: mood.createdAt.toISOString(),
            updated_at: mood.updatedAt.toISOString(),
          })
          .single();

        if (!error) {
          // Remove from offline storage
          await AsyncStorage.removeItem(`@next_chapter/mood_offline_${mood.id}`);
          syncedCount++;
        }
      } catch (error) {
        console.error('Failed to sync mood:', mood.id, error);
      }
    }

    return syncedCount;
  }

  async syncMoodEntry(mood: MoodEntry, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('mood_entries')
        .upsert({
          id: mood.id.startsWith('offline-') ? undefined : mood.id,
          user_id: userId,
          value: mood.value,
          note: mood.note,
          triggers: mood.triggers,
          activities: mood.activities,
          created_at: mood.createdAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .single();

      if (!error) {
        // Remove from offline storage if it was offline
        if (mood.id.startsWith('offline-')) {
          await AsyncStorage.removeItem(`@next_chapter/mood_offline_${mood.id}`);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to sync mood entry:', mood.id, error);
      return false;
    }
  }

  async exportMoodData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data: moods, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (format === 'json') {
        return JSON.stringify(moods, null, 2);
      } else {
        // CSV format
        const headers = ['Date', 'Time', 'Mood Value', 'Mood Label', 'Note'];
        const rows = moods?.map(mood => {
          const date = new Date(mood.created_at);
          return [
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            mood.value,
            this.getMoodLabel(mood.value),
            mood.note || '',
          ].join(',');
        }) || [];

        return [headers.join(','), ...rows].join('\n');
      }
    } catch (error) {
      console.error('Error exporting mood data:', error);
      throw error;
    }
  }

  private transformMoodEntry(data: any, synced: boolean): MoodEntry {
    return {
      id: data.id,
      userId: data.user_id,
      value: data.value,
      note: data.note,
      triggers: data.triggers,
      activities: data.activities,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      synced,
    };
  }

  private getMoodLabel(value: MoodValue): string {
    const labels = {
      [MoodValue.VeryLow]: 'Very Low',
      [MoodValue.Low]: 'Low',
      [MoodValue.Neutral]: 'Neutral',
      [MoodValue.Good]: 'Good',
      [MoodValue.VeryGood]: 'Very Good',
    };
    return labels[value] || 'Unknown';
  }
}

export const wellnessService = new WellnessService();