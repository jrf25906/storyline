import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData, decryptData } from '../../utils/encryption';
import { supabase } from '../api/supabase';
import {
  OnboardingStep,
  OnboardingData,
  OnboardingProgress,
  LayoffDetails,
  PersonalInfo,
  Goals,
  UserProfile,
} from '../../types/onboarding';

export class OnboardingService {
  private static readonly PROGRESS_KEY_PREFIX = '@next_chapter/onboarding_progress_';
  private static readonly STEP_ORDER: OnboardingStep[] = [
    'welcome',
    'layoff-details',
    'personal-info',
    'goals',
  ];

  /**
   * Save onboarding progress securely with encryption
   */
  async saveProgress(
    userId: string,
    currentStep: OnboardingStep,
    stepData: Partial<OnboardingData>
  ): Promise<void> {
    try {
      // Load existing progress to merge with new data
      const existingProgress = await this.loadProgress(userId);
      const existingData = existingProgress?.data || {};

      const progress: OnboardingProgress = {
        currentStep,
        data: { ...existingData, ...stepData },
        timestamp: Date.now(),
      };

      // Encrypt the entire progress object
      const encryptedProgress = await encryptData(progress);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(
        `${OnboardingService.PROGRESS_KEY_PREFIX}${userId}`,
        encryptedProgress
      );
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
      throw new Error('Failed to save onboarding progress');
    }
  }

  /**
   * Load encrypted onboarding progress
   */
  async loadProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const encryptedProgress = await AsyncStorage.getItem(
        `${OnboardingService.PROGRESS_KEY_PREFIX}${userId}`
      );

      if (!encryptedProgress) {
        return null;
      }

      const progress = await decryptData(encryptedProgress) as OnboardingProgress;
      return progress;
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
      return null;
    }
  }

  /**
   * Complete onboarding and save data to Supabase
   */
  async completeOnboarding(
    userId: string,
    data: OnboardingData
  ): Promise<void> {
    try {
      // Start a transaction by saving all data in sequence
      
      // 1. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          location: data.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Failed to save profile: ${profileError.message}`);
      }

      // 2. Save layoff details
      if (data.company && data.role && data.layoffDate) {
        const layoffDetails = {
          user_id: userId,
          company: data.company,
          role: data.role,
          layoff_date: data.layoffDate,
          severance_weeks: data.severanceWeeks ? parseInt(data.severanceWeeks) : null,
        };

        // Calculate severance end date if weeks provided
        if (layoffDetails.severance_weeks) {
          const layoffDate = new Date(data.layoffDate);
          const severanceEndDate = new Date(layoffDate);
          severanceEndDate.setDate(severanceEndDate.getDate() + (layoffDetails.severance_weeks * 7));
          (layoffDetails as any).severance_end_date = severanceEndDate.toISOString().split('T')[0];
        }

        const { error: layoffError } = await supabase
          .from('layoff_details')
          .upsert(layoffDetails, { onConflict: 'user_id' });

        if (layoffError) {
          throw new Error(`Failed to save layoff details: ${layoffError.message}`);
        }
      }

      // 3. Save user goals
      if (data.goals && data.goals.length > 0) {
        // First, deactivate all existing goals
        await supabase
          .from('user_goals')
          .update({ is_active: false })
          .eq('user_id', userId);

        // Then insert new active goals
        const goalRecords = data.goals.map(goal => ({
          user_id: userId,
          goal_type: goal,
          is_active: true,
        }));

        const { error: goalsError } = await supabase
          .from('user_goals')
          .upsert(goalRecords, { onConflict: 'user_id,goal_type' });

        if (goalsError) {
          throw new Error(`Failed to save goals: ${goalsError.message}`);
        }
      }

      // Clear local progress after successful save
      await this.clearProgress(userId);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  }

  /**
   * Validate data for a specific step
   */
  validateStep(step: OnboardingStep, data: Partial<OnboardingData>): boolean {
    switch (step) {
      case 'layoff-details':
        const layoffData = data as LayoffDetails;
        return !!(
          layoffData.company &&
          layoffData.company.trim() &&
          layoffData.role &&
          layoffData.role.trim() &&
          layoffData.layoffDate
        );

      case 'personal-info':
        const personalData = data as PersonalInfo;
        return !!(
          personalData.firstName &&
          personalData.firstName.trim() &&
          personalData.lastName &&
          personalData.lastName.trim()
        );

      case 'goals':
        const goalsData = data as Goals;
        return !!(goalsData.goals && goalsData.goals.length > 0);

      case 'welcome':
        return true;

      default:
        return false;
    }
  }

  /**
   * Get the next step in the onboarding flow
   */
  getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
    const currentIndex = OnboardingService.STEP_ORDER.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex === OnboardingService.STEP_ORDER.length - 1) {
      return null;
    }
    return OnboardingService.STEP_ORDER[currentIndex + 1];
  }

  /**
   * Get the previous step in the onboarding flow
   */
  getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
    const currentIndex = OnboardingService.STEP_ORDER.indexOf(currentStep);
    if (currentIndex <= 0) {
      return null;
    }
    return OnboardingService.STEP_ORDER[currentIndex - 1];
  }

  /**
   * Clear saved onboarding progress
   */
  async clearProgress(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(
        `${OnboardingService.PROGRESS_KEY_PREFIX}${userId}`
      );
    } catch (error) {
      console.error('Failed to clear onboarding progress:', error);
    }
  }

  /**
   * Check if user can proceed to next step
   */
  canProceed(currentStep: OnboardingStep, data: Partial<OnboardingData>): boolean {
    // Welcome step always allows proceeding
    if (currentStep === 'welcome') {
      return true;
    }

    // For other steps, validate the current step data
    return this.validateStep(currentStep, data);
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(currentStep: OnboardingStep): number {
    const currentIndex = OnboardingService.STEP_ORDER.indexOf(currentStep);
    if (currentIndex === -1) {
      return 0;
    }
    return ((currentIndex + 1) / OnboardingService.STEP_ORDER.length) * 100;
  }
}