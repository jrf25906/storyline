import { useEffect, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useOnboardingStore } from '@stores/onboardingStore';
import { OnboardingData } from '@types/onboarding';

export function useOnboarding() {
  const { user } = useAuth();
  const {
    currentStep,
    data,
    isLoading,
    error,
    isCompleted,
    loadProgress,
    saveStepData,
    completeOnboarding: storeCompleteOnboarding,
    isCurrentStepValid,
    canProceed,
    getProgressPercentage,
    goToNextStep,
    goToPreviousStep,
    reset,
  } = useOnboardingStore();

  // Load progress when user changes
  useEffect(() => {
    if (user?.id) {
      loadProgress(user.id);
    } else {
      reset();
    }
  }, [user?.id, loadProgress, reset]);

  // Save onboarding data for current step
  const saveOnboardingData = useCallback(
    async (stepData: Partial<OnboardingData>) => {
      if (!user?.id) return;
      await saveStepData(user.id, currentStep, stepData);
    },
    [user?.id, currentStep, saveStepData]
  );

  // Complete onboarding with additional data if needed
  const completeOnboarding = useCallback(
    async (finalData?: Partial<OnboardingData>) => {
      if (!user?.id) return;
      
      // Save any final data first
      if (finalData) {
        await saveStepData(user.id, 'goals', finalData);
      }
      
      // Then complete the onboarding
      await storeCompleteOnboarding(user.id);
    },
    [user?.id, saveStepData, storeCompleteOnboarding]
  );

  return {
    // State
    isOnboardingComplete: isCompleted,
    isLoading,
    error,
    onboardingData: data,
    currentStep,
    
    // Actions
    saveOnboardingData,
    completeOnboarding,
    
    // Navigation
    goToNextStep,
    goToPreviousStep,
    
    // Validation
    isCurrentStepValid,
    canProceed,
    
    // Progress
    progressPercentage: getProgressPercentage(),
  };
}