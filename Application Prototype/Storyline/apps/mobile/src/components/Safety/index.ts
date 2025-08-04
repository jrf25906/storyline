/**
 * Safety Components Index
 * 
 * Emotional safety and crisis intervention components for Storyline
 */

export { SafeSpaceIndicator } from './SafeSpaceIndicator';
export { SafeSpaceExample } from './SafeSpaceExample';
export type {
  SafetyState,
  CrisisLevel,
  EmotionalSupportAction,
  SafeSpaceIndicatorProps,
} from './SafeSpaceIndicator';

// Re-export safety theming utilities from design system
export {
  useSafetyTheme,
  safetyStateThemes,
} from '../../design-system/ThemeProvider';

// Re-export safety hooks
export { useSafetyState } from '../../hooks/safety';