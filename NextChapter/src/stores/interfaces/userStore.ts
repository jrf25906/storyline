import { BaseStore, BaseState, AsyncResult } from '@stores/interfaces/base';
import { Profile, LayoffDetails, UserGoal, GoalType } from '@types/database';

/**
 * User store state interface
 * Follows Interface Segregation Principle by separating concerns
 */
export interface UserState extends BaseState {
  profile: Profile | null;
  layoffDetails: LayoffDetails | null;
  goals: UserGoal[];
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
}

/**
 * Profile operations interface
 * Single Responsibility: Managing user profile
 */
export interface ProfileOperations {
  loadProfile: (userId: string) => AsyncResult;
  updateProfile: (updates: Partial<Profile>) => AsyncResult;
}

/**
 * Layoff details operations interface
 * Single Responsibility: Managing layoff information
 */
export interface LayoffDetailsOperations {
  loadLayoffDetails: (userId: string) => AsyncResult;
  saveLayoffDetails: (details: Omit<LayoffDetails, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => AsyncResult;
  updateLayoffDetails: (updates: Partial<LayoffDetails>) => AsyncResult;
}

/**
 * Goals operations interface
 * Single Responsibility: Managing user goals
 */
export interface GoalsOperations {
  loadGoals: (userId: string) => AsyncResult;
  setGoals: (goalTypes: GoalType[]) => AsyncResult;
  toggleGoal: (goalType: GoalType) => AsyncResult;
}

/**
 * Onboarding operations interface
 * Single Responsibility: Managing onboarding state
 */
export interface OnboardingOperations {
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

/**
 * Complete user store interface
 * Composed of all user-related operations
 */
export interface IUserStore extends 
  BaseStore,
  UserState,
  ProfileOperations,
  LayoffDetailsOperations,
  GoalsOperations,
  OnboardingOperations {
  // Additional methods if needed
}