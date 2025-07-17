import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for important actions
 * Following the "Grounded Optimism" design - gentle, supportive feedback
 */

export const HapticFeedback = {
  /**
   * Light impact - for small interactions
   * Used for: button presses, toggle switches
   */
  light: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Medium impact - for confirmations
   * Used for: task completion, form submission
   */
  medium: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Heavy impact - for major achievements
   * Used for: job offer received, milestone reached
   */
  heavy: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * Success notification - positive feedback
   * Used for: task completed, application sent
   */
  success: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Android doesn't have notification haptics, use medium impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Warning notification - gentle alert
   * Used for: form validation, gentle reminders
   */
  warning: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      // Android pattern: two quick light impacts
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 100);
    }
  },

  /**
   * Error notification - attention needed
   * Used for: error states, failed actions
   * Note: Use sparingly to avoid stress
   */
  error: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      // Android pattern: three quick light impacts
      for (let i = 0; i < 3; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  },

  /**
   * Selection changed - subtle feedback
   * Used for: picker selections, radio buttons
   */
  selection: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    } else {
      // Android doesn't have selection haptics, use very light impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
};

/**
 * Hook to add haptic feedback to interactions
 */
import { useCallback } from 'react';
import { useEmotionalState } from '../context/EmotionalStateContext';

export function useHaptics() {
  const { emotionalState } = useEmotionalState();

  // In crisis mode, reduce haptic intensity
  const isCrisisMode = emotionalState === 'crisis';

  const trigger = useCallback(
    async (type: keyof typeof HapticFeedback) => {
      try {
        // Skip haptics in crisis mode for certain types
        if (isCrisisMode && (type === 'error' || type === 'warning')) {
          // Use gentler feedback in crisis mode
          await HapticFeedback.light();
        } else {
          await HapticFeedback[type]();
        }
      } catch (error) {
        // Silently fail if haptics not available
        console.debug('Haptic feedback not available:', error);
      }
    },
    [isCrisisMode]
  );

  return { trigger };
}

/**
 * Component wrapper that adds haptic feedback to TouchableOpacity
 */
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface HapticTouchableProps extends TouchableOpacityProps {
  hapticType?: keyof typeof HapticFeedback;
  children: React.ReactNode;
}

export function HapticTouchable({
  hapticType = 'light',
  onPress,
  children,
  ...props
}: HapticTouchableProps) {
  const { trigger } = useHaptics();

  const handlePress = useCallback(
    async (event: any) => {
      await trigger(hapticType);
      onPress?.(event);
    },
    [onPress, hapticType, trigger]
  );

  return (
    <TouchableOpacity onPress={handlePress} {...props}>
      {children}
    </TouchableOpacity>
  );
}