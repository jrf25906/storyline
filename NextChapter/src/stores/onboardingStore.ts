/**
 * Temporary compatibility layer for onboardingStore migration
 * This file re-exports the refactored store while maintaining backward compatibility
 * 
 * TODO: Remove this file after all components have been updated to import from refactored/onboardingStore
 */
export { 
  useOnboardingStore,
  useOnboardingCompleted,
  useStepValidation,
  useOnboardingProgress,
  setOnboardingService 
} from './refactored/onboardingStore';

// Re-export types for backward compatibility
export type { 
  IOnboardingStore as OnboardingState,
  StepConfig 
} from './interfaces/onboardingStore';