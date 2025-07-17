import { useBouncePlanStore } from '../../../stores/bouncePlanStore';
import { useJobTrackerStore } from '../../../stores/jobTrackerStore';
import { useBudgetStore } from '../../../stores/budgetStore';
import { useWellnessStore } from '../../../stores/wellnessStore';
import { useCoachStore } from '../../../stores/coachStore';
import { supabase } from '../../api/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncResult {
  success: boolean;
  errors: string[];
  conflicts?: any[];
}

interface SyncStatus {
  pendingOperations: number;
  lastSync?: Date;
}

interface DetailedSyncStatus {
  bouncePlan: SyncStatus;
  jobApplications: SyncStatus;
  budget: SyncStatus;
  wellness: SyncStatus;
  coach: SyncStatus;
  totalPending: number;
  isFullySynced: boolean;
}

interface QueueItem {
  id: string;
  feature: string;
  type: string;
  timestamp: Date;
  data: any;
}

interface QueueVisualization {
  totalItems: number;
  byFeature: {
    bouncePlan: number;
    jobApplications: number;
    budget: number;
    wellness: number;
    coach: number;
  };
  items: QueueItem[];
  oldestItem?: Date;
  sizeInBytes?: number;
}

interface RetryResult {
  success: boolean;
  attempts: number;
  error?: string;
}

const RESUME_DRAFTS_KEY = '@next_chapter/resume_drafts';

export const syncManager = {
  syncAll: async (): Promise<SyncResult> => {
    console.log('Starting sync for all data...');
    const errors: string[] = [];
    const conflicts: any[] = [];
    let hasErrors = false;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, errors: ['User not authenticated'] };
      }
      
      // Sync Bounce Plan data
      const bouncePlanStore = useBouncePlanStore.getState();
      
      // Process offline queue if any
      if (bouncePlanStore.getOfflineQueueSize() > 0) {
        console.log(`Processing ${bouncePlanStore.getOfflineQueueSize()} offline operations...`);
        await bouncePlanStore.processOfflineQueue(user.id);
      }
      
      // Sync all bounce plan progress
      const syncSuccess = await bouncePlanStore.syncToDatabase(user.id);
      if (!syncSuccess) {
        errors.push('Failed to sync bounce plan progress');
        hasErrors = true;
      }
      
      // Sync Job Applications with conflict resolution
      try {
        const jobTrackerStore = useJobTrackerStore.getState();
        
        // Handle offline applications first
        if (jobTrackerStore.getOfflineApplications) {
          const offlineApps = jobTrackerStore.getOfflineApplications();
          if (offlineApps.length > 0) {
            const uploadResult = await jobTrackerStore.uploadOfflineApplications(user.id);
            if (!uploadResult.success) {
              errors.push(`Failed to upload ${uploadResult.failed} offline applications`);
              hasErrors = true;
            }
          }
        }
        
        // Handle pending sync applications with conflict resolution
        if (jobTrackerStore.getPendingSyncApplications) {
          const pendingApps = jobTrackerStore.getPendingSyncApplications();
          if (pendingApps.length > 0) {
            const conflictResult = await jobTrackerStore.resolveConflicts();
            
            // Upload local changes that are newer
            if (conflictResult.toUpload.length > 0) {
              await jobTrackerStore.syncApplications(conflictResult.toUpload, user.id);
            }
            
            // Update local with server changes that are newer
            if (conflictResult.toUpdate.length > 0) {
              await jobTrackerStore.updateLocalApplications(conflictResult.toUpdate);
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync job applications: ${errorMessage}`);
        hasErrors = true;
      }
      
      // Sync Budget Data with encryption
      try {
        const budgetStore = useBudgetStore.getState();
        if (budgetStore.hasPendingChanges && budgetStore.hasPendingChanges()) {
          const encryptedData = await budgetStore.encryptSensitiveData();
          const budgetSyncSuccess = await budgetStore.syncToDatabase(user.id);
          if (!budgetSyncSuccess) {
            errors.push('Failed to sync budget data');
            hasErrors = true;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync budget data: ${errorMessage}`);
        hasErrors = true;
      }
      
      // Sync Mood Entries
      try {
        const wellnessStore = useWellnessStore.getState();
        if (wellnessStore.getPendingSyncMoods) {
          const pendingMoods = wellnessStore.getPendingSyncMoods();
          if (pendingMoods.length > 0) {
            const moodSyncResult = await wellnessStore.syncMoodEntries(pendingMoods, user.id);
            if (!moodSyncResult.success) {
              errors.push(...moodSyncResult.errors);
              hasErrors = true;
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync mood entries: ${errorMessage}`);
        hasErrors = true;
      }
      
      // Sync Coach Conversations with merge
      try {
        const coachStore = useCoachStore.getState();
        if (coachStore.cloudSyncEnabled) {
          if (coachStore.getPendingSyncMessages) {
            const pendingMessages = coachStore.getPendingSyncMessages();
            if (pendingMessages.length > 0) {
              const mergeResult = await coachStore.mergeConversations();
              if (mergeResult.conflicts && mergeResult.conflicts.length > 0) {
                conflicts.push(...mergeResult.conflicts);
              }
              await coachStore.syncConversation();
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync coach conversations: ${errorMessage}`);
        hasErrors = true;
      }
      
      // Sync Resume Drafts
      try {
        const draftsJson = await AsyncStorage.getItem(RESUME_DRAFTS_KEY);
        if (draftsJson) {
          const drafts = JSON.parse(draftsJson);
          const pendingDrafts = drafts.filter((draft: any) => draft._syncStatus === 'pending');
          
          if (pendingDrafts.length > 0) {
            // Sync resume drafts logic would go here
            // For now, just mark as synced
            const updatedDrafts = drafts.map((draft: any) => ({
              ...draft,
              _syncStatus: 'synced'
            }));
            await AsyncStorage.setItem(RESUME_DRAFTS_KEY, JSON.stringify(updatedDrafts));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync resume drafts: ${errorMessage}`);
        hasErrors = true;
      }
      
      return { 
        success: !hasErrors, 
        errors,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown sync error'] 
      };
    }
  },
  
  // Check if there are pending syncs
  hasPendingSyncs: (): boolean => {
    const bouncePlanStore = useBouncePlanStore.getState();
    const jobTrackerStore = useJobTrackerStore.getState();
    const budgetStore = useBudgetStore.getState();
    const wellnessStore = useWellnessStore.getState();
    const coachStore = useCoachStore.getState();
    
    return (
      bouncePlanStore.getOfflineQueueSize() > 0 ||
      (jobTrackerStore.hasPendingSyncs && jobTrackerStore.hasPendingSyncs()) ||
      (budgetStore.hasPendingChanges && budgetStore.hasPendingChanges()) ||
      (wellnessStore.hasPendingSyncs && wellnessStore.hasPendingSyncs()) ||
      (coachStore.hasPendingSyncs && coachStore.hasPendingSyncs())
    );
  },
  
  // Get detailed sync status
  getSyncStatus: (): DetailedSyncStatus => {
    const bouncePlanStore = useBouncePlanStore.getState();
    const jobTrackerStore = useJobTrackerStore.getState();
    const budgetStore = useBudgetStore.getState();
    const wellnessStore = useWellnessStore.getState();
    const coachStore = useCoachStore.getState();
    
    const bouncePlanStatus = bouncePlanStore.getSyncStatus ? 
      bouncePlanStore.getSyncStatus() : 
      { pendingOperations: bouncePlanStore.getOfflineQueueSize() };
    
    const jobStatus = jobTrackerStore.getSyncStatus ? 
      jobTrackerStore.getSyncStatus() : 
      { pendingOperations: 0 };
    
    const budgetStatus = budgetStore.getSyncStatus ? 
      budgetStore.getSyncStatus() : 
      { pendingOperations: 0 };
    
    const wellnessStatus = wellnessStore.getSyncStatus ? 
      wellnessStore.getSyncStatus() : 
      { pendingOperations: 0 };
    
    const coachStatus = coachStore.getSyncStatus ? 
      coachStore.getSyncStatus() : 
      { pendingOperations: 0 };
    
    const totalPending = 
      bouncePlanStatus.pendingOperations +
      jobStatus.pendingOperations +
      budgetStatus.pendingOperations +
      wellnessStatus.pendingOperations +
      coachStatus.pendingOperations;
    
    return {
      bouncePlan: bouncePlanStatus,
      jobApplications: jobStatus,
      budget: budgetStatus,
      wellness: wellnessStatus,
      coach: coachStatus,
      totalPending,
      isFullySynced: totalPending === 0
    };
  },
  
  // Sync with retry logic
  syncWithRetry: async (feature: string, maxRetries: number = 3): Promise<RetryResult> => {
    let attempts = 0;
    let lastError: string = '';
    
    while (attempts < maxRetries) {
      attempts++;
      
      try {
        // Feature-specific sync logic
        switch (feature) {
          case 'jobApplications':
            const jobStore = useJobTrackerStore.getState();
            if (jobStore.syncApplications) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await jobStore.syncApplications(jobStore.applications, user.id);
              }
            }
            break;
          case 'budget':
            const budgetStore = useBudgetStore.getState();
            if (budgetStore.syncToDatabase) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await budgetStore.syncToDatabase(user.id);
              }
            }
            break;
          // Add other features as needed
        }
        
        return { success: true, attempts };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.log(`Sync attempt ${attempts} failed for ${feature}:`, lastError);
        
        // Exponential backoff
        if (attempts < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return { success: false, attempts, error: lastError };
  },
  
  // Get offline queue visualization
  getOfflineQueueVisualization: (): QueueVisualization => {
    const bouncePlanStore = useBouncePlanStore.getState();
    const jobTrackerStore = useJobTrackerStore.getState();
    const budgetStore = useBudgetStore.getState();
    const wellnessStore = useWellnessStore.getState();
    const coachStore = useCoachStore.getState();
    
    const items: QueueItem[] = [];
    let oldestTimestamp: Date | undefined;
    
    // Get queue items from each store
    if (bouncePlanStore.getOfflineQueue) {
      const bouncePlanQueue = bouncePlanStore.getOfflineQueue();
      items.push(...bouncePlanQueue.map((item: any) => ({
        ...item,
        feature: 'bouncePlan'
      })));
    }
    
    if (jobTrackerStore.getOfflineQueue) {
      const jobQueue = jobTrackerStore.getOfflineQueue();
      items.push(...jobQueue.map((item: any) => ({
        ...item,
        feature: 'jobApplications'
      })));
    }
    
    if (budgetStore.getOfflineQueue) {
      const budgetQueue = budgetStore.getOfflineQueue();
      items.push(...budgetQueue.map((item: any) => ({
        ...item,
        feature: 'budget'
      })));
    }
    
    if (wellnessStore.getOfflineQueue) {
      const wellnessQueue = wellnessStore.getOfflineQueue();
      items.push(...wellnessQueue.map((item: any) => ({
        ...item,
        feature: 'wellness'
      })));
    }
    
    if (coachStore.getOfflineQueue) {
      const coachQueue = coachStore.getOfflineQueue();
      items.push(...coachQueue.map((item: any) => ({
        ...item,
        feature: 'coach'
      })));
    }
    
    // Find oldest item
    if (items.length > 0) {
      oldestTimestamp = items.reduce((oldest, item) => {
        const itemDate = new Date(item.timestamp);
        return !oldest || itemDate < oldest ? itemDate : oldest;
      }, undefined as Date | undefined);
    }
    
    // Calculate size (rough estimate)
    const sizeInBytes = JSON.stringify(items).length;
    
    return {
      totalItems: items.length,
      byFeature: {
        bouncePlan: items.filter(i => i.feature === 'bouncePlan').length,
        jobApplications: items.filter(i => i.feature === 'jobApplications').length,
        budget: items.filter(i => i.feature === 'budget').length,
        wellness: items.filter(i => i.feature === 'wellness').length,
        coach: items.filter(i => i.feature === 'coach').length
      },
      items,
      oldestItem: oldestTimestamp,
      sizeInBytes
    };
  },
  
  // Clear specific queue item
  clearQueueItem: async (itemId: string): Promise<boolean> => {
    // Implementation would depend on how each store manages its queue
    // This is a placeholder
    return true;
  }
};