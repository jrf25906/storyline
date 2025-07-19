import { supabase } from '@services/api/supabase';
import { JobApplication, JobApplicationStatus } from '@types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@next_chapter/job_applications';
const SYNC_STATUS_KEY = '@next_chapter/job_applications_sync';

export interface JobApplicationService {
  getAll: (userId: string) => Promise<JobApplication[]>;
  create: (userId: string, application: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<JobApplication>;
  update: (id: string, updates: Partial<JobApplication>) => Promise<JobApplication>;
  delete: (id: string) => Promise<void>;
  updateStatus: (id: string, status: JobApplicationStatus) => Promise<JobApplication>;
  syncOfflineChanges: (userId: string) => Promise<void>;
  getOfflineApplications: () => Promise<JobApplication[]>;
  saveOfflineApplications: (applications: JobApplication[]) => Promise<void>;
}

class JobApplicationServiceImpl implements JobApplicationService {
  async getAll(userId: string): Promise<JobApplication[]> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cache the results
      if (data) {
        await this.saveOfflineApplications(data);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching job applications:', error);
      // Return cached data if available
      return await this.getOfflineApplications();
    }
  }

  async create(
    userId: string,
    application: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<JobApplication> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          ...application,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating job application:', error);
      // Create offline with temporary ID
      const offlineApplication: JobApplication = {
        ...application,
        id: `offline_${Date.now()}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to offline storage
      const applications = await this.getOfflineApplications();
      applications.push(offlineApplication);
      await this.saveOfflineApplications(applications);

      // Mark for sync
      await this.markForSync(offlineApplication.id, 'create');

      return offlineApplication;
    }
  }

  async update(id: string, updates: Partial<JobApplication>): Promise<JobApplication> {
    const timestamp = new Date().toISOString();
    
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .update({
          ...updates,
          updated_at: timestamp,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update cache
      const applications = await this.getOfflineApplications();
      const index = applications.findIndex(app => app.id === id);
      if (index !== -1) {
        applications[index] = data;
        await this.saveOfflineApplications(applications);
      }

      return data;
    } catch (error) {
      console.error('Error updating job application:', error);
      
      // Update offline
      const applications = await this.getOfflineApplications();
      const index = applications.findIndex(app => app.id === id);
      
      if (index !== -1) {
        applications[index] = {
          ...applications[index],
          ...updates,
          updated_at: timestamp,
        };
        await this.saveOfflineApplications(applications);
        await this.markForSync(id, 'update');
        return applications[index];
      }
      
      throw new Error('Application not found');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from cache
      const applications = await this.getOfflineApplications();
      const filtered = applications.filter(app => app.id !== id);
      await this.saveOfflineApplications(filtered);
    } catch (error) {
      console.error('Error deleting job application:', error);
      
      // Delete offline
      const applications = await this.getOfflineApplications();
      const filtered = applications.filter(app => app.id !== id);
      await this.saveOfflineApplications(filtered);
      
      if (!id.startsWith('offline_')) {
        await this.markForSync(id, 'delete');
      }
    }
  }

  async updateStatus(id: string, status: JobApplicationStatus): Promise<JobApplication> {
    return this.update(id, { status });
  }

  async getOfflineApplications(): Promise<JobApplication[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading offline applications:', error);
      return [];
    }
  }

  async saveOfflineApplications(applications: JobApplication[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch (error) {
      console.error('Error saving offline applications:', error);
    }
  }

  private async markForSync(id: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      const syncData = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      const syncStatus = syncData ? JSON.parse(syncData) : {};
      
      syncStatus[id] = {
        action,
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
    } catch (error) {
      console.error('Error marking for sync:', error);
    }
  }

  async syncOfflineChanges(userId: string): Promise<void> {
    try {
      const syncData = await AsyncStorage.getItem(SYNC_STATUS_KEY);
      if (!syncData) return;

      const syncStatus: Record<string, { action: 'create' | 'update' | 'delete' }> = JSON.parse(syncData);
      const applications = await this.getOfflineApplications();

      for (const [id, { action }] of Object.entries(syncStatus)) {
        try {
          switch (action) {
            case 'create':
              const appToCreate = applications.find(app => app.id === id);
              if (appToCreate && id.startsWith('offline_')) {
                const { id: _, ...createData } = appToCreate;
                const created = await this.create(userId, createData);
                
                // Replace offline ID with real ID
                const updatedApps = applications.map(app =>
                  app.id === id ? created : app
                );
                await this.saveOfflineApplications(updatedApps);
              }
              break;

            case 'update':
              const appToUpdate = applications.find(app => app.id === id);
              if (appToUpdate && !id.startsWith('offline_')) {
                await this.update(id, appToUpdate);
              }
              break;

            case 'delete':
              if (!id.startsWith('offline_')) {
                await this.delete(id);
              }
              break;
          }

          // Remove from sync queue
          delete syncStatus[id];
        } catch (error) {
          console.error(`Error syncing ${action} for ${id}:`, error);
        }
      }

      // Update sync status
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(syncStatus));
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    }
  }
}

export const jobApplicationService = new JobApplicationServiceImpl();