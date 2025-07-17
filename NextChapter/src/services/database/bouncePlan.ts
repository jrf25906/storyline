import { supabase } from '../api/supabase';
import { BouncePlanTask } from '../../types/database';

export interface BouncePlanProgress {
  tasks: BouncePlanTask[];
  startDate?: Date;
}

export interface TaskUpdate {
  taskId: string;
  completed?: boolean;
  skipped?: boolean;
  notes?: string;
}

/**
 * Load bounce plan progress for a user
 */
export async function loadBouncePlanProgress(userId: string): Promise<BouncePlanProgress> {
  try {
    const { data, error } = await supabase
      .from('bounce_plan_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('day_number', { ascending: true });
    
    if (error) {
      console.error('Error loading bounce plan progress:', error);
      return { tasks: [] };
    }
    
    // Get the earliest task to determine start date
    const startDate = data && data.length > 0 
      ? new Date(data[0].created_at)
      : undefined;
    
    return {
      tasks: data || [],
      startDate,
    };
  } catch (error) {
    console.error('Error in loadBouncePlanProgress:', error);
    return { tasks: [] };
  }
}

/**
 * Sync a single task update to the database
 */
export async function syncBouncePlanProgress(
  userId: string,
  update: TaskUpdate
): Promise<boolean> {
  try {
    // Extract day number from task ID (e.g., 'day1_breathe' -> 1)
    const dayMatch = update.taskId.match(/day(\d+)_/);
    if (!dayMatch) {
      console.error('Invalid task ID format:', update.taskId);
      return false;
    }
    
    const dayNumber = parseInt(dayMatch[1], 10);
    
    // Check if task already exists
    const { data: existing, error: checkError } = await supabase
      .from('bounce_plan_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('task_id', update.taskId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is fine
      console.error('Error checking existing task:', checkError);
      return false;
    }
    
    // Prepare the task data
    const taskData = {
      user_id: userId,
      day_number: dayNumber,
      task_id: update.taskId,
      completed_at: update.completed ? new Date().toISOString() : null,
      skipped_at: update.skipped ? new Date().toISOString() : null,
      notes: update.notes || null,
    };
    
    let result;
    if (existing) {
      // Update existing task
      const { error: updateError } = await supabase
        .from('bounce_plan_tasks')
        .update({
          completed_at: taskData.completed_at,
          skipped_at: taskData.skipped_at,
          notes: taskData.notes,
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error('Error updating task:', updateError);
        return false;
      }
    } else {
      // Insert new task
      const { error: insertError } = await supabase
        .from('bounce_plan_tasks')
        .insert(taskData);
      
      if (insertError) {
        console.error('Error inserting task:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in syncBouncePlanProgress:', error);
    return false;
  }
}

/**
 * Batch sync multiple task updates
 */
export async function batchSyncBouncePlanProgress(
  userId: string,
  updates: TaskUpdate[]
): Promise<boolean> {
  try {
    const results = await Promise.all(
      updates.map(update => syncBouncePlanProgress(userId, update))
    );
    
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error in batchSyncBouncePlanProgress:', error);
    return false;
  }
}

/**
 * Reset bounce plan progress for a user
 */
export async function resetBouncePlanProgress(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bounce_plan_tasks')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error resetting bounce plan progress:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in resetBouncePlanProgress:', error);
    return false;
  }
}

/**
 * Get task completion stats for analytics
 */
export async function getBouncePlanStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('bounce_plan_tasks')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting bounce plan stats:', error);
      return null;
    }
    
    const totalTasks = data?.length || 0;
    const completedTasks = data?.filter(task => task.completed_at).length || 0;
    const skippedTasks = data?.filter(task => task.skipped_at).length || 0;
    const tasksWithNotes = data?.filter(task => task.notes).length || 0;
    
    return {
      totalTasks,
      completedTasks,
      skippedTasks,
      tasksWithNotes,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  } catch (error) {
    console.error('Error in getBouncePlanStats:', error);
    return null;
  }
}