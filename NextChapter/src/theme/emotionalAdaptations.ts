import { ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, Typography, Borders } from '@theme/index';

/**
 * UI adaptations for different emotional states
 * Based on the "Grounded Optimism" design system
 */

// Crisis Mode Adaptations
export const CrisisModeAdaptations = {
  // Increased spacing for reduced cognitive load
  spacing: {
    screenPadding: Spacing.xl,        // 32px instead of 16px
    componentGap: Spacing.xl,         // Larger gaps between elements
    touchTarget: 64,                  // Even larger touch targets
    cardPadding: Spacing.xl,          // More breathing room in cards
  },

  // Simplified visual hierarchy
  typography: {
    // Increase all font sizes by 2px in crisis mode
    display: Typography.fontSizes.display + 2,
    h1: Typography.fontSizes.h1 + 2,
    h2: Typography.fontSizes.h2 + 2,
    h3: Typography.fontSizes.h3 + 2,
    body: Typography.fontSizes.body + 2,
    bodyLarge: Typography.fontSizes.bodyLarge + 2,
    caption: Typography.fontSizes.caption + 2,
  },

  // High contrast colors
  colors: {
    primary: Colors.primary,
    text: Colors.textPrimary,
    background: Colors.white,          // Pure white for maximum contrast
    border: Colors.textPrimary,        // Darker borders for clarity
  },

  // Component-specific styles
  button: {
    minHeight: 64,
    paddingHorizontal: Spacing.xl,
    borderWidth: 3,                    // Thicker borders for visibility
  } as ViewStyle,

  card: {
    borderWidth: 3,
    borderColor: Colors.primary,
    padding: Spacing.xl,
  } as ViewStyle,

  input: {
    minHeight: 64,
    fontSize: Typography.fontSizes.bodyLG,
    borderWidth: 3,
  } as TextStyle & ViewStyle,
};

// Success Mode Adaptations
export const SuccessModeAdaptations = {
  // Celebratory colors
  colors: {
    primary: Colors.accent,           // Soft Amber for celebration
    secondary: Colors.successMint,
    background: Colors.background,
    accent: Colors.success,
  },

  // More personality in animations
  animations: {
    duration: 300,                    // Slightly longer for celebration
    springDamping: 10,                // Bouncier animations
    springStiffness: 120,
  },

  // Component celebrations
  card: {
    borderColor: Colors.successMint,
    backgroundColor: Colors.white,
  } as ViewStyle,

  badge: {
    backgroundColor: Colors.accent,
    transform: [{ scale: 1.1 }],      // Slightly larger badges
  } as ViewStyle,

  progressBar: {
    backgroundColor: Colors.successMint,
    height: 8,                        // Thicker progress bars
  } as ViewStyle,
};

// Struggling Mode Adaptations
export const StrugglingModeAdaptations = {
  // Gentle encouragement
  colors: {
    primary: Colors.calmBlue,         // Calming primary
    text: Colors.textPrimary,
    background: Colors.background,
  },

  // Softer shadows
  shadows: {
    shadowOpacity: 0.05,              // Very subtle shadows
    shadowRadius: 12,
  },

  // More guidance
  typography: {
    lineHeight: Typography.lineHeights.loose, // Extra line spacing
  },

  // Gentle components
  button: {
    backgroundColor: Colors.calmBlue,
    borderRadius: Borders.radius.xl,  // Rounder, friendlier buttons
  } as ViewStyle,
};

/**
 * Get adapted styles based on emotional state
 */
export function getEmotionalAdaptations(state: 'normal' | 'crisis' | 'success' | 'struggling') {
  switch (state) {
    case 'crisis':
      return CrisisModeAdaptations;
    case 'success':
      return SuccessModeAdaptations;
    case 'struggling':
      return StrugglingModeAdaptations;
    default:
      return null;
  }
}

/**
 * Merge adaptations with base styles
 */
export function applyEmotionalAdaptations<T extends ViewStyle | TextStyle>(
  baseStyle: T,
  adaptations: Partial<T> | null
): T {
  if (!adaptations) return baseStyle;
  return { ...baseStyle, ...adaptations };
}