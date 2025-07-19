import { StateCreator } from 'zustand';
import { createStore, createInitialState, handleAsyncOperation } from '@stores/factory/createStore';
import { IUserStore, UserState } from '@stores/interfaces/userStore';
import { supabase } from '@services/api/supabase';
import { Profile, LayoffDetails, UserGoal, GoalType } from '@types';

/**
 * Initial state for user store
 */
const initialState = createInitialState<Omit<UserState, 'isLoading' | 'error'>>({
  profile: null,
  layoffDetails: null,
  goals: [],
  isAuthenticated: false,
  onboardingCompleted: false,
});

/**
 * User store implementation
 * Follows Single Responsibility Principle by separating user-related state management
 * Uses Dependency Inversion Principle by depending on interfaces
 */
const userStoreCreator: StateCreator<IUserStore, [], [], IUserStore> = (set, get) => ({
  ...initialState,

  // Profile Operations
  loadProfile: async (userId: string) => {
    return handleAsyncOperation(
      set,
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      },
      {
        onSuccess: (profile) => set({ profile }),
        onError: (error) => console.error('Error loading profile:', error),
      }
    );
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const profile = get().profile;
    if (!profile) throw new Error('No profile to update');

    return handleAsyncOperation(
      set,
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      {
        onSuccess: (profile) => set({ profile }),
        onError: (error) => console.error('Error updating profile:', error),
      }
    );
  },

  // Layoff Details Operations
  loadLayoffDetails: async (userId: string) => {
    return handleAsyncOperation(
      set,
      async () => {
        const { data, error } = await supabase
          .from('layoff_details')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      {
        onSuccess: (layoffDetails) => set({ layoffDetails }),
        onError: (error) => console.error('Error loading layoff details:', error),
      }
    );
  },

  saveLayoffDetails: async (details: Omit<LayoffDetails, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const profile = get().profile;
    if (!profile) throw new Error('No authenticated user');

    return handleAsyncOperation(
      set,
      async () => {
        const { data, error } = await supabase
          .from('layoff_details')
          .insert({
            ...details,
            user_id: profile.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      {
        onSuccess: (layoffDetails) => set({ layoffDetails }),
        onError: (error) => console.error('Error saving layoff details:', error),
      }
    );
  },

  updateLayoffDetails: async (updates: Partial<LayoffDetails>) => {
    const layoffDetails = get().layoffDetails;
    if (!layoffDetails) throw new Error('No layoff details to update');

    return handleAsyncOperation(
      set,
      async () => {
        const { data, error } = await supabase
          .from('layoff_details')
          .update(updates)
          .eq('id', layoffDetails.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      {
        onSuccess: (layoffDetails) => set({ layoffDetails }),
        onError: (error) => console.error('Error updating layoff details:', error),
      }
    );
  },

  // Goals Operations
  loadGoals: async (userId: string) => {
    return handleAsyncOperation(
      set,
      async () => {
        const { data, error } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (error) throw error;
        return data || [];
      },
      {
        onSuccess: (goals) => set({ goals }),
        onError: (error) => console.error('Error loading goals:', error),
      }
    );
  },

  setGoals: async (goalTypes: GoalType[]) => {
    const profile = get().profile;
    if (!profile) throw new Error('No authenticated user');

    return handleAsyncOperation(
      set,
      async () => {
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

        // Reload goals
        await get().loadGoals(profile.id);
      },
      {
        onError: (error) => console.error('Error setting goals:', error),
      }
    );
  },

  toggleGoal: async (goalType: GoalType) => {
    const profile = get().profile;
    if (!profile) throw new Error('No authenticated user');

    const currentGoals = get().goals;
    const existingGoal = currentGoals.find(g => g.goal_type === goalType);

    return handleAsyncOperation(
      set,
      async () => {
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

        // Reload goals
        await get().loadGoals(profile.id);
      },
      {
        onError: (error) => console.error('Error toggling goal:', error),
      }
    );
  },

  // Onboarding Operations
  completeOnboarding: () => {
    set({ onboardingCompleted: true });
  },

  resetOnboarding: () => {
    set({ onboardingCompleted: false });
  },

  // Base Store Operations
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the user store
 * Uses factory pattern for consistent store creation
 */
export const useUserStore = createStore<IUserStore>(
  userStoreCreator,
  {
    name: 'user-store',
    persist: true,
    partialize: (state) => ({
      onboardingCompleted: state.onboardingCompleted,
      // Don't persist sensitive data
    }),
  }
);