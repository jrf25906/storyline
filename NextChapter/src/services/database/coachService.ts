import { supabase } from '../api/supabase';
import { CoachMessage } from '../../types/coach';

export class CoachDatabaseService {
  /**
   * Sync coach conversation to cloud (when enabled)
   */
  async syncConversation(userId: string, messages: CoachMessage[]) {
    try {
      // Delete existing messages for this user first
      const { error: deleteError } = await supabase
        .from('coach_conversations')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting old messages:', deleteError);
        throw deleteError;
      }

      // Insert new messages
      const messagesToInsert = messages.map(msg => ({
        user_id: userId,
        message: msg.content,
        role: msg.role,
        tone: msg.tone || null,
        created_at: msg.timestamp,
      }));

      const { error: insertError } = await supabase
        .from('coach_conversations')
        .insert(messagesToInsert);

      if (insertError) {
        console.error('Error inserting messages:', insertError);
        throw insertError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error syncing conversation:', error);
      throw error;
    }
  }

  /**
   * Load coach conversation from cloud
   */
  async loadConversation(userId: string): Promise<CoachMessage[]> {
    try {
      const { data, error } = await supabase
        .from('coach_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading conversation:', error);
        throw error;
      }

      return (data || []).map(row => ({
        id: row.id,
        content: row.message,
        role: row.role as 'user' | 'assistant',
        tone: row.tone,
        timestamp: new Date(row.created_at),
      }));
    } catch (error) {
      console.error('Error loading conversation:', error);
      throw error;
    }
  }

  /**
   * Get message count for a specific date
   */
  async getMessageCountForDate(userId: string, date: Date): Promise<number> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { count, error } = await supabase
        .from('coach_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('role', 'user')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (error) {
        console.error('Error getting message count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting message count:', error);
      return 0;
    }
  }
}

export const coachDatabaseService = new CoachDatabaseService();