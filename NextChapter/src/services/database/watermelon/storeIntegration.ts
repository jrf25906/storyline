import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { 
  getDatabase,
  Profile,
  JobApplication,
  BudgetEntry,
  MoodEntry,
  BouncePlanTask,
  CoachConversation,
  WellnessActivity,
  LayoffDetails,
  UserGoal
} from '@services/database/watermelon/index';
import { getSyncManager } from '@services/database/index';

/**
 * Helper functions to integrate WatermelonDB with existing Zustand stores
 * These functions provide a bridge between the stores and WatermelonDB
 */

// Profile operations
export async function getLocalProfile(userId: string): Promise<Profile | null> {
  const db = getDatabase();
  const collection = db.collections.get<Profile>('profiles');
  
  try {
    const profile = await collection.find(userId);
    return profile;
  } catch {
    return null;
  }
}

export async function saveLocalProfile(profileData: any): Promise<Profile> {
  const db = getDatabase();
  const collection = db.collections.get<Profile>('profiles');
  
  return await db.write(async () => {
    const existing = await getLocalProfile(profileData.id);
    
    if (existing) {
      return await existing.updateProfile(profileData);
    } else {
      return await collection.create(profile => {
        profile._raw.id = profileData.id;
        Object.assign(profile, profileData);
      });
    }
  });
}

// Job Application operations
export async function getLocalJobApplications(userId: string): Promise<JobApplication[]> {
  const db = getDatabase();
  const collection = db.collections.get<JobApplication>('job_applications');
  
  return await collection
    .query(Q.where('user_id', userId))
    .fetch();
}

export async function saveLocalJobApplication(jobData: any): Promise<JobApplication> {
  const db = getDatabase();
  const collection = db.collections.get<JobApplication>('job_applications');
  
  return await db.write(async () => {
    if (jobData.id) {
      const existing = await collection.find(jobData.id);
      if (existing) {
        await existing.update(record => {
          Object.assign(record, jobData);
          record.syncStatus = 'pending';
        });
        return existing;
      }
    }
    
    return await collection.create(job => {
      if (jobData.id) job._raw.id = jobData.id;
      Object.assign(job, jobData);
      job.syncStatus = 'pending';
    });
  });
}

// Budget Entry operations
export async function getLocalBudgetEntries(userId: string): Promise<BudgetEntry[]> {
  const db = getDatabase();
  const collection = db.collections.get<BudgetEntry>('budget_entries');
  
  return await collection
    .query(
      Q.where('user_id', userId),
      Q.where('is_active', true)
    )
    .fetch();
}

export async function saveLocalBudgetEntry(entryData: any): Promise<BudgetEntry> {
  const db = getDatabase();
  const collection = db.collections.get<BudgetEntry>('budget_entries');
  
  return await db.write(async () => {
    if (entryData.id) {
      const existing = await collection.find(entryData.id);
      if (existing) {
        if (entryData.amount !== undefined) {
          await existing.updateAmount(entryData.amount);
        }
        await existing.update(record => {
          Object.assign(record, entryData);
          record.syncStatus = 'pending';
        });
        return existing;
      }
    }
    
    const entry = await collection.create(async budget => {
      if (entryData.id) budget._raw.id = entryData.id;
      Object.assign(budget, entryData);
      if (entryData.amount !== undefined) {
        budget.encryptedAmount = await budget.encryptAmount(entryData.amount);
      }
      budget.syncStatus = 'pending';
    });
    
    return entry;
  });
}

// Mood Entry operations
export async function getLocalMoodEntries(userId: string, limit?: number): Promise<MoodEntry[]> {
  const db = getDatabase();
  const collection = db.collections.get<MoodEntry>('mood_entries');
  
  let query = collection.query(
    Q.where('user_id', userId),
    Q.sortBy('created_at', Q.desc)
  );
  
  if (limit) {
    query = query.take(limit);
  }
  
  return await query.fetch();
}

export async function saveLocalMoodEntry(moodData: any): Promise<MoodEntry> {
  const db = getDatabase();
  const collection = db.collections.get<MoodEntry>('mood_entries');
  
  return await db.write(async () => {
    return await collection.create(mood => {
      if (moodData.id) mood._raw.id = moodData.id;
      Object.assign(mood, moodData);
      mood.syncStatus = 'pending';
    });
  });
}

// Bounce Plan Task operations
export async function getLocalBouncePlanTasks(userId: string): Promise<BouncePlanTask[]> {
  const db = getDatabase();
  const collection = db.collections.get<BouncePlanTask>('bounce_plan_tasks');
  
  return await collection
    .query(
      Q.where('user_id', userId),
      Q.sortBy('day_number', Q.asc)
    )
    .fetch();
}

export async function saveLocalBouncePlanTask(taskData: any): Promise<BouncePlanTask> {
  const db = getDatabase();
  const collection = db.collections.get<BouncePlanTask>('bounce_plan_tasks');
  
  return await db.write(async () => {
    // Check if task exists
    const existing = await collection
      .query(
        Q.where('user_id', taskData.user_id),
        Q.where('task_id', taskData.task_id)
      )
      .fetch();
    
    if (existing.length > 0) {
      const task = existing[0];
      await task.update(record => {
        Object.assign(record, taskData);
        record.syncStatus = 'pending';
      });
      return task;
    }
    
    return await collection.create(task => {
      if (taskData.id) task._raw.id = taskData.id;
      Object.assign(task, taskData);
      task.syncStatus = 'pending';
    });
  });
}

// Coach Conversation operations
export async function getLocalCoachConversations(
  userId: string, 
  limit: number = 25
): Promise<CoachConversation[]> {
  const db = getDatabase();
  const collection = db.collections.get<CoachConversation>('coach_conversations');
  
  return await collection
    .query(
      Q.where('user_id', userId),
      Q.sortBy('created_at', Q.desc),
      Q.take(limit)
    )
    .fetch();
}

export async function saveLocalCoachMessage(messageData: any): Promise<CoachConversation> {
  const db = getDatabase();
  const collection = db.collections.get<CoachConversation>('coach_conversations');
  
  return await db.write(async () => {
    return await collection.create(conversation => {
      if (messageData.id) conversation._raw.id = messageData.id;
      Object.assign(conversation, messageData);
      conversation.syncStatus = 'pending';
    });
  });
}

// Wellness Activity operations
export async function getLocalWellnessActivities(userId: string): Promise<WellnessActivity[]> {
  const db = getDatabase();
  const collection = db.collections.get<WellnessActivity>('wellness_activities');
  
  return await collection
    .query(
      Q.where('user_id', userId),
      Q.sortBy('completed_at', Q.desc)
    )
    .fetch();
}

export async function saveLocalWellnessActivity(activityData: any): Promise<WellnessActivity> {
  const db = getDatabase();
  const collection = db.collections.get<WellnessActivity>('wellness_activities');
  
  return await db.write(async () => {
    return await collection.create(activity => {
      if (activityData.id) activity._raw.id = activityData.id;
      Object.assign(activity, activityData);
      activity.syncStatus = 'pending';
    });
  });
}

// Layoff Details operations
export async function getLocalLayoffDetails(userId: string): Promise<LayoffDetails | null> {
  const db = getDatabase();
  const collection = db.collections.get<LayoffDetails>('layoff_details');
  
  const details = await collection
    .query(Q.where('user_id', userId))
    .fetch();
  
  return details.length > 0 ? details[0] : null;
}

export async function saveLocalLayoffDetails(detailsData: any): Promise<LayoffDetails> {
  const db = getDatabase();
  const collection = db.collections.get<LayoffDetails>('layoff_details');
  
  return await db.write(async () => {
    const existing = await getLocalLayoffDetails(detailsData.user_id);
    
    if (existing) {
      await existing.updateDetails(detailsData);
      return existing;
    }
    
    return await collection.create(details => {
      if (detailsData.id) details._raw.id = detailsData.id;
      Object.assign(details, detailsData);
      details.syncStatus = 'pending';
    });
  });
}

// User Goals operations
export async function getLocalUserGoals(userId: string): Promise<UserGoal[]> {
  const db = getDatabase();
  const collection = db.collections.get<UserGoal>('user_goals');
  
  return await collection
    .query(
      Q.where('user_id', userId),
      Q.where('is_active', true)
    )
    .fetch();
}

export async function saveLocalUserGoal(goalData: any): Promise<UserGoal> {
  const db = getDatabase();
  const collection = db.collections.get<UserGoal>('user_goals');
  
  return await db.write(async () => {
    if (goalData.id) {
      const existing = await collection.find(goalData.id);
      if (existing) {
        await existing.update(record => {
          Object.assign(record, goalData);
          record.syncStatus = 'pending';
        });
        return existing;
      }
    }
    
    return await collection.create(goal => {
      if (goalData.id) goal._raw.id = goalData.id;
      Object.assign(goal, goalData);
      goal.syncStatus = 'pending';
    });
  });
}

// Sync helpers
export async function syncUserData(userId: string): Promise<void> {
  const syncManager = getSyncManager();
  const result = await syncManager.sync(userId);
  
  if (!result.success) {
    console.error('Sync failed:', result.error);
    throw new Error(result.error || 'Sync failed');
  }
  
  if (result.conflicts && result.conflicts.length > 0) {
    console.warn('Sync completed with conflicts:', result.conflicts);
    // Handle conflicts as needed
  }
}

// Offline queue helpers
export async function checkOfflineQueue(): Promise<number> {
  const syncManager = getSyncManager();
  const queue = syncManager.getOfflineQueue();
  return queue.length;
}

// Storage management helpers
export async function checkStorageUsage(): Promise<{
  size: number;
  percentage: number;
  nearLimit: boolean;
}> {
  const syncManager = getSyncManager();
  const size = await syncManager.getDatabaseSize();
  const softLimit = 20 * 1024 * 1024; // 20MB
  const hardLimit = 25 * 1024 * 1024; // 25MB
  
  return {
    size,
    percentage: (size / hardLimit) * 100,
    nearLimit: size >= softLimit
  };
}

export async function cleanupOldDataIfNeeded(): Promise<void> {
  const usage = await checkStorageUsage();
  if (usage.nearLimit) {
    const syncManager = getSyncManager();
    await syncManager.cleanOldData();
  }
}