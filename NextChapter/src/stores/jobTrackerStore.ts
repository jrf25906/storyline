import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JobApplication, JobApplicationStatus } from '../types/database';
import { supabase } from '../services/api/supabase';

interface JobTrackerState {
  applications: JobApplication[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedStatus: JobApplicationStatus | 'all';
  offlineQueue: any[];
  lastSync?: Date;
  
  // Actions
  loadApplications: () => Promise<void>;
  addApplication: (application: Omit<JobApplication, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateApplication: (id: string, updates: Partial<JobApplication>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  updateApplicationStatus: (id: string, status: JobApplicationStatus) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: JobApplicationStatus | 'all') => void;
  syncWithSupabase: () => Promise<void>;
  
  // Sync-related actions
  hasPendingSyncs: () => boolean;
  getSyncStatus: () => { pendingOperations: number; lastSync?: Date };
  getPendingSyncApplications: () => JobApplication[];
  getOfflineApplications: () => JobApplication[];
  uploadOfflineApplications: (userId: string) => Promise<{ success: boolean; uploaded: number; failed: number }>;
  resolveConflicts: () => Promise<{ toUpload: JobApplication[]; toUpdate: JobApplication[] }>;
  syncApplications: (applications: JobApplication[], userId: string) => Promise<boolean>;
  updateLocalApplications: (serverApplications: JobApplication[]) => Promise<boolean>;
  getOfflineQueue: () => any[];
}

const STORAGE_KEY = '@next_chapter/job_applications';

export const useJobTrackerStore = create<JobTrackerState>((set, get) => ({
  applications: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedStatus: 'all',
  offlineQueue: [],
  lastSync: undefined,

  loadApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      // First try to load from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          set({ applications: data, isLoading: false });
          // Cache to local storage
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } else {
        // Load from local storage if no user
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          set({ applications: JSON.parse(cached), isLoading: false });
        }
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      // Fallback to local storage
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          set({ applications: JSON.parse(cached), isLoading: false });
        }
      } catch (localError) {
        set({ error: 'Failed to load applications', isLoading: false });
      }
    }
  },

  addApplication: async (application) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const timestamp = new Date().toISOString();
      
      if (user) {
        const { data, error } = await supabase
          .from('job_applications')
          .insert({
            ...application,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const currentApplications = [...get().applications, data];
          set({ applications: currentApplications });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications));
        }
      } else {
        // Offline mode - create temporary ID
        const newApplication: JobApplication = {
          ...application,
          id: `temp_${Date.now()}`,
          user_id: 'offline',
          created_at: timestamp,
          updated_at: timestamp,
        };
        
        const currentApplications = [...get().applications, newApplication];
        set({ applications: currentApplications });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications));
      }
    } catch (error) {
      console.error('Error adding application:', error);
      set({ error: 'Failed to add application' });
    }
  },

  updateApplication: async (id, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const timestamp = new Date().toISOString();
      
      if (user && !id.startsWith('temp_')) {
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

        if (data) {
          const currentApplications = get().applications.map(app =>
            app.id === id ? data : app
          );
          set({ applications: currentApplications });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications));
        }
      } else {
        // Offline mode
        const currentApplications = get().applications.map(app =>
          app.id === id ? { ...app, ...updates, updated_at: timestamp } : app
        );
        set({ applications: currentApplications });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications));
      }
    } catch (error) {
      console.error('Error updating application:', error);
      set({ error: 'Failed to update application' });
    }
  },

  updateApplicationStatus: async (id, status) => {
    await get().updateApplication(id, { status });
  },

  deleteApplication: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && !id.startsWith('temp_')) {
        const { error } = await supabase
          .from('job_applications')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }
      
      const currentApplications = get().applications.filter(app => app.id !== id);
      set({ applications: currentApplications });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications));
    } catch (error) {
      console.error('Error deleting application:', error);
      set({ error: 'Failed to delete application' });
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedStatus: (status) => {
    set({ selectedStatus: status });
  },

  syncWithSupabase: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const applications = get().applications;
      const tempApplications = applications.filter(app => app.id.startsWith('temp_'));
      
      // Upload temporary applications
      for (const tempApp of tempApplications) {
        const { id, ...appData } = tempApp;
        const { data, error } = await supabase
          .from('job_applications')
          .insert({
            ...appData,
            user_id: user.id,
          })
          .select()
          .single();

        if (!error && data) {
          // Replace temp app with real one
          const currentApplications = get().applications.map(app =>
            app.id === id ? data : app
          );
          set({ applications: currentApplications });
        }
      }

      // Reload all applications from server
      await get().loadApplications();
      set({ lastSync: new Date() });
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      set({ error: 'Failed to sync applications' });
    }
  },

  // Sync-related methods
  hasPendingSyncs: () => {
    const applications = get().applications;
    return applications.some(app => 
      app.id.startsWith('temp_') || 
      (app as any)._syncStatus === 'pending'
    );
  },

  getSyncStatus: () => {
    const applications = get().applications;
    const pendingCount = applications.filter(app => 
      app.id.startsWith('temp_') || 
      (app as any)._syncStatus === 'pending'
    ).length;
    
    return {
      pendingOperations: pendingCount,
      lastSync: get().lastSync
    };
  },

  getPendingSyncApplications: () => {
    return get().applications.filter(app => 
      (app as any)._syncStatus === 'pending' && !app.id.startsWith('temp_')
    );
  },

  getOfflineApplications: () => {
    return get().applications.filter(app => app.id.startsWith('temp_'));
  },

  uploadOfflineApplications: async (userId: string) => {
    const offlineApps = get().getOfflineApplications();
    let uploaded = 0;
    let failed = 0;

    for (const app of offlineApps) {
      try {
        const { id, ...appData } = app;
        const { data, error } = await supabase
          .from('job_applications')
          .insert({
            ...appData,
            user_id: userId,
          })
          .select()
          .single();

        if (!error && data) {
          // Replace temp app with real one
          const currentApplications = get().applications.map(a =>
            a.id === id ? data : a
          );
          set({ applications: currentApplications });
          uploaded++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Error uploading offline application:', error);
        failed++;
      }
    }

    return { success: failed === 0, uploaded, failed };
  },

  resolveConflicts: async () => {
    const pendingApps = get().getPendingSyncApplications();
    const toUpload: JobApplication[] = [];
    const toUpdate: JobApplication[] = [];

    for (const app of pendingApps) {
      try {
        // Fetch server version
        const { data: serverApp, error } = await supabase
          .from('job_applications')
          .select('*')
          .eq('id', app.id)
          .single();

        if (error || !serverApp) {
          // Doesn't exist on server, upload it
          toUpload.push(app);
        } else {
          // Compare timestamps (last-write-wins)
          const localTime = new Date((app as any)._localUpdatedAt || app.updated_at).getTime();
          const serverTime = new Date(serverApp.updated_at).getTime();
          
          if (localTime > serverTime) {
            toUpload.push(app);
          } else {
            toUpdate.push(serverApp);
          }
        }
      } catch (error) {
        console.error('Error resolving conflict for app:', app.id, error);
      }
    }

    return { toUpload, toUpdate };
  },

  syncApplications: async (applications: JobApplication[], userId: string) => {
    try {
      for (const app of applications) {
        const { data, error } = await supabase
          .from('job_applications')
          .upsert({
            ...app,
            user_id: userId,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error syncing application:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error in syncApplications:', error);
      return false;
    }
  },

  updateLocalApplications: async (serverApplications: JobApplication[]) => {
    const currentApplications = get().applications;
    const updatedApplications = currentApplications.map(localApp => {
      const serverApp = serverApplications.find(s => s.id === localApp.id);
      return serverApp || localApp;
    });
    
    set({ applications: updatedApplications });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedApplications));
    return true;
  },

  getOfflineQueue: () => {
    const applications = get().applications;
    const queue = [];
    
    // Add temp applications
    const tempApps = applications.filter(app => app.id.startsWith('temp_'));
    for (const app of tempApps) {
      queue.push({
        id: app.id,
        type: 'application_create',
        timestamp: new Date(app.created_at),
        data: app
      });
    }
    
    // Add pending updates
    const pendingUpdates = applications.filter(app => 
      (app as any)._syncStatus === 'pending' && !app.id.startsWith('temp_')
    );
    for (const app of pendingUpdates) {
      queue.push({
        id: `update_${app.id}`,
        type: 'application_update',
        timestamp: new Date(app.updated_at),
        data: app
      });
    }
    
    return queue;
  },
}));