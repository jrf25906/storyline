import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getHapticFeedbackType } from '../utils/accessibility';

interface UseAccessibilityOptions {
  announceOnMount?: string;
  announceOnChange?: string;
  enableHaptics?: boolean;
}

/**
 * Custom hook for managing accessibility features
 * Handles screen reader announcements, haptic feedback, and focus management
 */
export function useAccessibility(options: UseAccessibilityOptions = {}) {
  const { announceOnMount, announceOnChange, enableHaptics = true } = options;
  const previousAnnouncement = useRef<string>();

  // Announce on mount
  useEffect(() => {
    if (announceOnMount) {
      announceForAccessibility(announceOnMount);
    }
  }, [announceOnMount]);

  // Announce on change
  useEffect(() => {
    if (announceOnChange && announceOnChange !== previousAnnouncement.current) {
      announceForAccessibility(announceOnChange);
      previousAnnouncement.current = announceOnChange;
    }
  }, [announceOnChange]);

  /**
   * Make an announcement to screen readers
   */
  const announceForAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  /**
   * Trigger haptic feedback with appropriate intensity
   */
  const triggerHapticFeedback = async (
    type: 'success' | 'warning' | 'error' | 'selection' | 'impact'
  ) => {
    if (!enableHaptics) return;

    try {
      if (Platform.OS === 'ios') {
        const feedbackType = getHapticFeedbackType(type);
        switch (feedbackType) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'rigid':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
            break;
          case 'soft':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            break;
        }
      } else {
        // Android has different haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  };

  /**
   * Set accessibility focus to a specific element
   */
  const setAccessibilityFocus = (ref: React.RefObject<any>) => {
    if (ref.current) {
      AccessibilityInfo.setAccessibilityFocus(ref.current);
    }
  };

  /**
   * Check if screen reader is enabled
   */
  const checkScreenReaderEnabled = async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.warn('Failed to check screen reader status:', error);
      return false;
    }
  };

  /**
   * Check if reduce motion is enabled
   */
  const checkReduceMotionEnabled = async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch (error) {
      console.warn('Failed to check reduce motion status:', error);
      return false;
    }
  };

  return {
    announceForAccessibility,
    triggerHapticFeedback,
    setAccessibilityFocus,
    checkScreenReaderEnabled,
    checkReduceMotionEnabled,
  };
}

/**
 * Hook for managing focus trap (e.g., in modals)
 */
export function useFocusTrap(isActive: boolean) {
  const firstFocusableRef = useRef<any>(null);
  const lastFocusableRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && firstFocusableRef.current) {
      // Set initial focus
      AccessibilityInfo.setAccessibilityFocus(firstFocusableRef.current);
    }
  }, [isActive]);

  const handleTabNavigation = (event: any, isShiftTab: boolean) => {
    if (!isActive) return;

    if (isShiftTab && event.target === firstFocusableRef.current) {
      // Shift+Tab on first element, move to last
      event.preventDefault();
      if (lastFocusableRef.current) {
        AccessibilityInfo.setAccessibilityFocus(lastFocusableRef.current);
      }
    } else if (!isShiftTab && event.target === lastFocusableRef.current) {
      // Tab on last element, move to first
      event.preventDefault();
      if (firstFocusableRef.current) {
        AccessibilityInfo.setAccessibilityFocus(firstFocusableRef.current);
      }
    }
  };

  return {
    firstFocusableRef,
    lastFocusableRef,
    handleTabNavigation,
  };
}

/**
 * Hook for managing live regions
 */
export function useLiveRegion(
  message: string | undefined,
  priority: 'polite' | 'assertive' = 'polite'
) {
  useEffect(() => {
    if (message) {
      // Delay slightly to ensure the message is announced
      const timer = setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(message);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [message, priority]);
}

export default useAccessibility;