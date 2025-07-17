import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/api/supabase';
import { Profile, LayoffDetails, UserGoal, GoalType } from '../types/database';

interface UserStore {
  // State
  profile: Profile | null;
  layoffDetails: LayoffDetails | null;
  goals: UserGoal[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  onboardingCompleted: boolean;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;

  // Profile actions
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  
  // Layoff details actions
  loadLayoffDetails: (userId: string) => Promise<void>;
  saveLayoffDetails: (details: Omit<LayoffDetails, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLayoffDetails: (updates: Partial<LayoffDetails>) => Promise<void>;

  // Goals actions
  loadGoals: (userId: string) => Promise<void>;
  setGoals: (goalTypes: GoalType[]) => Promise<void>;
  toggleGoal: (goalType: GoalType) => Promise<void>;

  // Onboarding
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Utility
  reset: () => void;
}

const initialState = {
  profile: null,
  layoffDetails: null,
  goals: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
  onboardingCompleted: false,
};

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        signIn: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) throw error;

            if (data.user) {
              set({ isAuthenticated: true });
              await get().loadProfile(data.user.id);
              await get().loadLayoffDetails(data.user.id);
              await get().loadGoals(data.user.id);
            }
            
            set({ isLoading: false });
          } catch (error) {
            console.error('Sign in error:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to sign in',
              isLoading: false 
            });
            throw error;
          }
        },

        signUp: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) throw error;

            if (data.user) {
              set({ isAuthenticated: true });
              // Create initial profile
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({ id: data.user.id });
              
              if (profileError) throw profileError;
              
              await get().loadProfile(data.user.id);
            }
            
            set({ isLoading: false });
          } catch (error) {
            console.error('Sign up error:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to sign up',
              isLoading: false 
            });
            throw error;
          }
        },

        signOut: async () => {
          set({ isLoading: true, error: null });
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            // Reset all stores
            get().reset();
          } catch (error) {
            console.error('Sign out error:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to sign out',
              isLoading: false 
            });
            throw error;
          }
        },

        checkSession: async () => {
          set({ isLoading: true });
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (session?.user) {
              set({ isAuthenticated: true });
              await get().loadProfile(session.user.id);
              await get().loadLayoffDetails(session.user.id);
              await get().loadGoals(session.user.id);
            } else {
              set({ isAuthenticated: false });
            }
            
            set({ isLoading: false });
          } catch (error) {
            console.error('Session check error:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to check session',
              isLoading: false,
              isAuthenticated: false 
            });
          }
        },

        loadProfile: async (userId) => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();

            if (error) throw error;

            set({ profile: data });
          } catch (error) {
            console.error('Error loading profile:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to load profile' });
          }
        },

        updateProfile: async (updates) => {
          const profile = get().profile;
          if (!profile) throw new Error('No profile to update');

          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', profile.id)
              .select()
              .single();

            if (error) throw error;

            set({ profile: data, isLoading: false });
          } catch (error) {
            console.error('Error updating profile:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update profile',
              isLoading: false 
            });
            throw error;
          }
        },

        loadLayoffDetails: async (userId) => {
          try {
            const { data, error } = await supabase
              .from('layoff_details')
              .select('*')
              .eq('user_id', userId)
              .single();

            if (error && error.code !== 'PGRST116') throw error;

            set({ layoffDetails: data });
          } catch (error) {
            console.error('Error loading layoff details:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to load layoff details' });
          }
        },

        saveLayoffDetails: async (details) => {
          const profile = get().profile;
          if (!profile) throw new Error('No authenticated user');

          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase
              .from('layoff_details')
              .insert({
                ...details,
                user_id: profile.id,
              })
              .select()
              .single();

            if (error) throw error;

            set({ layoffDetails: data, isLoading: false });
          } catch (error) {
            console.error('Error saving layoff details:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save layoff details',
              isLoading: false 
            });
            throw error;
          }
        },

        updateLayoffDetails: async (updates) => {
          const layoffDetails = get().layoffDetails;
          if (!layoffDetails) throw new Error('No layoff details to update');

          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase
              .from('layoff_details')
              .update(updates)
              .eq('id', layoffDetails.id)
              .select()
              .single();

            if (error) throw error;

            set({ layoffDetails: data, isLoading: false });
          } catch (error) {
            console.error('Error updating layoff details:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update layoff details',
              isLoading: false 
            });
            throw error;
          }
        },

        loadGoals: async (userId) => {
          try {
            const { data, error } = await supabase
              .from('user_goals')
              .select('*')
              .eq('user_id', userId)
              .eq('is_active', true);

            if (error) throw error;

            set({ goals: data || [] });
          } catch (error) {
            console.error('Error loading goals:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to load goals' });
          }
        },

        setGoals: async (goalTypes) => {
          const profile = get().profile;
          if (!profile) throw new Error('No authenticated user');

          set({ isLoading: true, error: null });
          try {
            // First, deactivate all existing goals
            await supabase
              .from('user_goals')
              .update({ is_active: false })
              .eq('user_id', profile.id);

            // Then insert new goals
            if (goalTypes.length > 0) {
              const goalsToInsert = goalTypes.map(goal_type => ({
                user_id: profile.id,
                goal_type,
                is_active: true,
              }));

              const { error } = await supabase
                .from('user_goals')
                .insert(goalsToInsert);

              if (error) throw error;
            }

            await get().loadGoals(profile.id);
            set({ isLoading: false });
          } catch (error) {
            console.error('Error setting goals:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to set goals',
              isLoading: false 
            });
            throw error;
          }
        },

        toggleGoal: async (goalType) => {
          const profile = get().profile;
          if (!profile) throw new Error('No authenticated user');

          const currentGoals = get().goals;
          const existingGoal = currentGoals.find(g => g.goal_type === goalType);

          set({ isLoading: true, error: null });
          try {
            if (existingGoal) {
              // Deactivate the goal
              await supabase
                .from('user_goals')
                .update({ is_active: false })
                .eq('id', existingGoal.id);
            } else {
              // Activate/create the goal
              await supabase
                .from('user_goals')
                .insert({
                  user_id: profile.id,
                  goal_type: goalType,
                  is_active: true,
                });
            }

            await get().loadGoals(profile.id);
            set({ isLoading: false });
          } catch (error) {
            console.error('Error toggling goal:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to toggle goal',
              isLoading: false 
            });
            throw error;
          }
        },

        completeOnboarding: () => {
          set({ onboardingCompleted: true });
        },

        resetOnboarding: () => {
          set({ onboardingCompleted: false });
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'user-store',
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
          onboardingCompleted: state.onboardingCompleted,
        }),
      }
    ),
    {
      name: 'UserStore',
    }
  )
);