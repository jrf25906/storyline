import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  voiceControlEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  announceStateChanges: boolean;
  extendedTimeouts: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  announceForAccessibility: (message: string, priority?: 'polite' | 'assertive') => void;
  setAccessibilityFocus: (ref: React.RefObject<any>) => void;
  isAccessibilityEnabled: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = '@next_chapter/accessibility_settings';

interface AccessibilityProviderProps {
  children: ReactNode;
}

/**
 * Enhanced Accessibility Provider
 * Manages advanced accessibility features and settings
 * Part of Phase 3: Advanced Emotional Intelligence
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    screenReaderEnabled: false,
    reduceMotionEnabled: false,
    highContrastEnabled: false,
    largeTextEnabled: false,
    voiceControlEnabled: false,
    hapticFeedbackEnabled: true,
    announceStateChanges: true,
    extendedTimeouts: false,
  });

  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState(false);

  // Load settings and detect system accessibility features
  useEffect(() => {
    const initializeAccessibility = async () => {
      try {
        // Load saved settings
        const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        // Detect system accessibility features
        const [
          screenReader,
          reduceMotion,
          // Add more system checks as needed
        ] = await Promise.all([
          AccessibilityInfo.isScreenReaderEnabled(),
          AccessibilityInfo.isReduceMotionEnabled(),
        ]);

        setSettings(prev => ({
          ...prev,
          screenReaderEnabled: screenReader,
          reduceMotionEnabled: reduceMotion,
        }));

        setIsAccessibilityEnabled(screenReader || reduceMotion);

      } catch (error) {
        console.error('Error initializing accessibility:', error);
      }
    };

    initializeAccessibility();

    // Listen for accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setSettings(prev => ({ ...prev, screenReaderEnabled: enabled }));
        setIsAccessibilityEnabled(prev => prev || enabled);
      }
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setSettings(prev => ({ ...prev, reduceMotionEnabled: enabled }));
      }
    );

    return () => {
      screenReaderListener?.remove();
      reduceMotionListener?.remove();
    };
  }, []);

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving accessibility settings:', error);
      }
    };

    saveSettings();
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const announceForAccessibility = (
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (settings.announceStateChanges) {
      // Add slight delay for better screen reader experience
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(message);
      }, priority === 'assertive' ? 0 : 100);
    }
  };

  const setAccessibilityFocus = (ref: React.RefObject<any>) => {
    if (ref.current && settings.screenReaderEnabled) {
      AccessibilityInfo.setAccessibilityFocus(ref.current);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        announceForAccessibility,
        setAccessibilityFocus,
        isAccessibilityEnabled,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
}

/**
 * Hook for accessibility-aware animations
 */
export function useAccessibleAnimation() {
  const { settings } = useAccessibilityContext();
  
  return {
    shouldAnimate: !settings.reduceMotionEnabled,
    duration: settings.reduceMotionEnabled ? 0 : undefined,
    extendedTimeout: settings.extendedTimeouts ? 10000 : 5000,
  };
}

/**
 * Hook for accessibility-aware styling
 */
export function useAccessibleStyling() {
  const { settings } = useAccessibilityContext();
  
  return {
    fontSize: settings.largeTextEnabled ? 1.2 : 1,
    contrast: settings.highContrastEnabled ? 'high' : 'normal',
    touchTargetSize: settings.screenReaderEnabled ? 48 : 44,
  };
}