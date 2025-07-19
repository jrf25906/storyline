import { StateCreator } from 'zustand';
import { createStore, createInitialState, handleAsyncOperation } from '@stores/factory/createStore';
import { IOnboardingStore, OnboardingState, StepConfig } from '@stores/interfaces/onboardingStore';
import { OnboardingStep, OnboardingData } from '@types';
import { OnboardingService } from '@services/onboarding';

/**
 * Step configuration for onboarding flow
 * Defines navigation and validation rules
 */
const STEP_CONFIG: StepConfig[] = [
  {
    step: 'welcome',
    required: true,
    requiredFields: [],
    nextStep: 'layoff-details',
  },
  {
    step: 'layoff-details',
    required: true,
    requiredFields: ['company', 'role', 'layoffDate'],
    nextStep: 'personal-info',
    previousStep: 'welcome',
  },
  {
    step: 'personal-info',
    required: true,
    requiredFields: ['firstName', 'lastName'],
    nextStep: 'goals',
    previousStep: 'layoff-details',
  },
  {
    step: 'goals',
    required: true,
    requiredFields: ['goals'],
    previousStep: 'personal-info',
  },
];

/**
 * Get configuration for a specific step
 */
const getStepConfig = (step: OnboardingStep): StepConfig => {
  const config = STEP_CONFIG.find(s => s.step === step);
  if (!config) {
    throw new Error(`Invalid onboarding step: ${step}`);
  }
  return config;
};

/**
 * Initial state for onboarding store
 */
const initialState = createInitialState<Omit<OnboardingState, 'isLoading' | 'error'>>({
  currentStep: 'welcome',
  data: {},
  isCompleted: false,
});

/**
 * Create onboarding service instance
 * Can be injected for testing
 */
let onboardingService = new OnboardingService();

/**
 * Set a custom onboarding service (useful for testing)
 */
export const setOnboardingService = (service: OnboardingService) => {
  onboardingService = service;
};

/**
 * Onboarding store implementation
 * Follows Single Responsibility Principle by managing onboarding flow
 * Uses Dependency Inversion Principle with OnboardingService
 */
const onboardingStoreCreator: StateCreator<IOnboardingStore, [], [], IOnboardingStore> = (set, get) => ({
  ...initialState,

  // Navigation Operations
  setCurrentStep: (step: OnboardingStep) => {
    set({ currentStep: step });
  },

  goToNextStep: () => {
    const { currentStep } = get();
    const config = getStepConfig(currentStep);
    
    if (config.nextStep) {
      set({ currentStep: config.nextStep });
    }
  },

  goToPreviousStep: () => {
    const { currentStep } = get();
    const config = getStepConfig(currentStep);
    
    if (config.previousStep) {
      set({ currentStep: config.previousStep });
    }
  },

  // Data Operations
  setData: (data: Partial<OnboardingData>) => {
    set((state) => ({ 
      data: { ...state.data, ...data } 
    }));
  },

  saveStepData: async (
    userId: string, 
    step: OnboardingStep, 
    stepData: Partial<OnboardingData>
  ) => {
    const { data } = get();
    const updatedData = { ...data, ...stepData };
    
    // Update local state immediately
    set({ 
      currentStep: step,
      data: updatedData,
    });

    return handleAsyncOperation(
      set,
      async () => {
        await onboardingService.saveProgress(userId, step, stepData);
      },
      {
        onError: (error) => {
          console.error('Failed to save progress:', error);
          // Data is still saved locally even if remote save fails
        },
      }
    );
  },

  // Progress Operations
  loadProgress: async (userId: string) => {
    return handleAsyncOperation(
      set,
      async () => {
        const progress = await onboardingService.loadProgress(userId);
        if (progress) {
          set({
            currentStep: progress.currentStep,
            data: progress.data,
          });
        }
        return progress;
      },
      {
        onError: (error) => {
          console.error('Failed to load progress:', error);
        },
      }
    );
  },

  completeOnboarding: async (userId: string) => {
    const { data } = get();
    
    return handleAsyncOperation(
      set,
      async () => {
        await onboardingService.completeOnboarding(userId, data);
        set({ isCompleted: true });
      },
      {
        onError: (error) => {
          console.error('Failed to complete onboarding:', error);
        },
      }
    );
  },

  getProgressPercentage: () => {
    const { currentStep } = get();
    const currentIndex = STEP_CONFIG.findIndex(s => s.step === currentStep);
    return Math.round(((currentIndex + 1) / STEP_CONFIG.length) * 100);
  },

  // Validation Operations
  isCurrentStepValid: () => {
    const { currentStep, data } = get();
    const config = getStepConfig(currentStep);
    
    // Check if all required fields are filled
    return config.requiredFields.every(field => {
      const value = data[field];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== '';
    });
  },

  canProceed: () => {
    const { currentStep } = get();
    const config = getStepConfig(currentStep);
    
    // Can proceed if there's a next step and current step is valid
    return !!config.nextStep && get().isCurrentStepValid();
  },

  // Base Store Operations
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the onboarding store
 * Uses factory pattern for consistent store creation
 */
export const useOnboardingStore = createStore<IOnboardingStore>(
  onboardingStoreCreator,
  {
    name: 'onboarding-store',
    persist: true,
    partialize: (state) => ({
      currentStep: state.currentStep,
      data: state.data,
      isCompleted: state.isCompleted,
      // Don't persist loading states
    }),
  }
);

/**
 * Hook to get onboarding completion status
 */
export const useOnboardingCompleted = () => {
  return useOnboardingStore(state => state.isCompleted);
};

/**
 * Hook to get current step validation status
 */
export const useStepValidation = () => {
  const isValid = useOnboardingStore(state => state.isCurrentStepValid());
  const canProceed = useOnboardingStore(state => state.canProceed());
  return { isValid, canProceed };
};

/**
 * Hook to get onboarding progress
 */
export const useOnboardingProgress = () => {
  const currentStep = useOnboardingStore(state => state.currentStep);
  const percentage = useOnboardingStore(state => state.getProgressPercentage());
  const stepIndex = STEP_CONFIG.findIndex(s => s.step === currentStep);
  const totalSteps = STEP_CONFIG.length;
  
  return {
    currentStep,
    percentage,
    stepIndex: stepIndex + 1,
    totalSteps,
  };
};