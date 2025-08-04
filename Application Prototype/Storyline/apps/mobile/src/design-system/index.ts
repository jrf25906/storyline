/**
 * Design System Entry Point
 * Storyline Mobile App Design System - Voice-First, Emotionally Safe
 */

// Tokens
export {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  voice,
  safety,
} from './tokens';

// Theme Provider and Hooks
export {
  ThemeProvider,
  useTheme,
  useColors,
  useTypography,
  useSpacing,
  useVoiceTheme,
  useSafetyTheme,
  createThemedStyles,
  voiceStateThemes,
  safetyStateThemes,
} from './ThemeProvider';

// Types
export type {
  Theme,
  ThemeMode,
} from './ThemeProvider';

// Re-export commonly used design tokens as convenient objects
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  voice,
  safety,
} from './tokens';

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  voice,
  safety,
};

// Voice-specific utilities
export const voiceTokens = {
  states: {
    idle: 'idle' as const,
    listening: 'listening' as const,
    recording: 'recording' as const,
    processing: 'processing' as const,
    speaking: 'speaking' as const,
    error: 'error' as const,
  },
  colors: voice,
  feedback: voice.feedback,
  bubble: voice.bubble,
  waveform: voice.waveform,
};

// Safety-specific utilities
export const safetyTokens = {
  emotional: safety.emotional,
  crisis: safety.crisis,
  safeSpace: safety.safeSpace,
  a11y: safety.a11y,
};

// Common style patterns for React Native
export const commonStyles = {
  // Reusable shadow styles for React Native
  shadows: {
    card: shadows.base,
    button: shadows.md,
    modal: shadows.xl,
  },
  
  // Common border radius patterns
  radius: {
    button: borderRadius.lg,
    card: borderRadius.xl,
    input: borderRadius.md,
    modal: borderRadius['2xl'],
  },
  
  // Typography helpers for React Native TextStyle
  text: {
    display: typography.sizes.display,
    headline: typography.sizes.headline,
    title: typography.sizes.title,
    bodyLarge: typography.sizes.bodyLarge,
    body: typography.sizes.body,
    caption: typography.sizes.caption,
    label: typography.sizes.label,
  },
  
  // Voice interface specific styles
  voice: {
    recordingButton: {
      width: spacing.voice.recordingButtonSize,
      height: spacing.voice.recordingButtonSize,
      borderRadius: spacing.voice.recordingButtonSize / 2,
    },
    waveform: {
      height: spacing.voice.waveformHeight,
      borderRadius: borderRadius.lg,
    },
    bubble: {
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      marginVertical: spacing.voice.conversationBubbleSpacing / 2,
    },
  },
  
  // Safety interface specific styles
  safety: {
    safeSpaceIndicator: {
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    emergencyButton: {
      minHeight: safety.a11y.minTouchTarget,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
  },
};

// Accessibility helpers
export const a11yHelpers = {
  minTouchTarget: safety.a11y.minTouchTarget,
  focusRing: {
    borderWidth: safety.a11y.focusRingWidth,
    borderColor: safety.a11y.focusRingColor,
  },
  highContrast: safety.a11y.highContrast,
};