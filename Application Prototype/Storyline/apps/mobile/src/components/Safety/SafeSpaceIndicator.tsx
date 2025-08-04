/**
 * SafeSpaceIndicator.tsx
 * 
 * Emotional safety UI component for the Storyline mobile app.
 * Provides trauma-informed design with crisis detection, self-care options,
 * and gentle emotional support indicators.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafetyTheme, useTheme, safetyStateThemes } from '../../design-system/ThemeProvider';

// Types for safety states and crisis levels
export type SafetyState = 'safe' | 'caution' | 'concern';
export type CrisisLevel = 'none' | 'low' | 'medium' | 'high';
export type EmotionalSupportAction = 'pause' | 'break' | 'breathing' | 'resources' | 'emergency';

export interface SafeSpaceIndicatorProps {
  /** Current safety state */
  safetyState?: SafetyState;
  
  /** Crisis detection level */
  crisisLevel?: CrisisLevel;
  
  /** Whether safe space mode is active */
  isActive?: boolean;
  
  /** Show break/pause controls */
  showControls?: boolean;
  
  /** Custom encouraging message */
  message?: string;
  
  /** Callback when user needs a break */
  onBreakRequested?: () => void;
  
  /** Callback when user needs emotional support */
  onSupportRequested?: (action: EmotionalSupportAction) => void;
  
  /** Callback when crisis intervention is needed */
  onCrisisDetected?: (level: CrisisLevel) => void;
  
  /** Whether to show detailed emotional support options */
  showDetailedSupport?: boolean;
  
  /** Accessibility label override */
  accessibilityLabel?: string;
}

export const SafeSpaceIndicator: React.FC<SafeSpaceIndicatorProps> = ({
  safetyState = 'safe',
  crisisLevel = 'none',
  isActive = true,
  showControls = true,
  message,
  onBreakRequested,
  onSupportRequested,
  onCrisisDetected,
  showDetailedSupport = false,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const safetyTheme = useSafetyTheme();
  
  // Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [expandAnim] = useState(new Animated.Value(0));
  
  // State management
  const [showSupportOptions, setShowSupportOptions] = useState(false);
  const [lastCrisisLevel, setLastCrisisLevel] = useState<CrisisLevel>('none');

  // Get appropriate theming based on current state
  const currentTheme = safetyStateThemes[safetyState](theme);
  const crisisColor = crisisLevel !== 'none' ? theme.safety.crisis[crisisLevel] : null;

  // Default encouraging messages based on state
  const getDefaultMessage = useCallback(() => {
    switch (safetyState) {
      case 'safe':
        return "You're in a safe space. Take your time.";
      case 'caution':
        return "Remember, you're in control. Take a breath if needed.";
      case 'concern':
        return "It's okay to pause. Your wellbeing comes first.";
      default:
        return "You're safe here.";
    }
  }, [safetyState]);

  // Handle crisis level changes
  useEffect(() => {
    if (crisisLevel !== lastCrisisLevel && crisisLevel !== 'none') {
      setLastCrisisLevel(crisisLevel);
      
      // Trigger haptic feedback for crisis detection
      if (crisisLevel === 'high') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      // Notify parent component
      onCrisisDetected?.(crisisLevel);
      
      // Start pulse animation for high crisis levels
      if (crisisLevel === 'high') {
        startPulseAnimation();
      }
    }
  }, [crisisLevel, lastCrisisLevel, onCrisisDetected]);

  // Fade in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: theme.animations.duration.emotional,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulse animation for high crisis situations
  const startPulseAnimation = useCallback(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: theme.animations.duration.moderate,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: theme.animations.duration.moderate,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (crisisLevel === 'high') {
          pulse();
        }
      });
    };
    pulse();
  }, [crisisLevel, pulseAnim, theme.animations.duration.moderate]);

  // Handle support option toggle
  const toggleSupportOptions = useCallback(() => {
    const newValue = !showSupportOptions;
    setShowSupportOptions(newValue);
    
    Animated.timing(expandAnim, {
      toValue: newValue ? 1 : 0,
      duration: theme.animations.duration.moderate,
      useNativeDriver: false,
    }).start();
  }, [showSupportOptions, expandAnim, theme.animations.duration.moderate]);

  // Handle break request
  const handleBreakRequest = useCallback(() => {
    Haptics.selectionAsync();
    onBreakRequested?.();
    onSupportRequested?.('break');
  }, [onBreakRequested, onSupportRequested]);

  // Handle pause request  
  const handlePauseRequest = useCallback(() => {
    Haptics.selectionAsync();
    onSupportRequested?.('pause');
  }, [onSupportRequested]);

  // Handle breathing exercise
  const handleBreathingExercise = useCallback(() => {
    Haptics.selectionAsync();
    onSupportRequested?.('breathing');
  }, [onSupportRequested]);

  // Handle resources request
  const handleResourcesRequest = useCallback(() => {
    Haptics.selectionAsync();
    onSupportRequested?.('resources');
  }, [onSupportRequested]);

  // Handle emergency resources
  const handleEmergencyResources = useCallback(() => {
    Alert.alert(
      'Crisis Resources',
      'Would you like to access immediate support resources?',
      [
        {
          text: 'Not now',
          style: 'cancel',
        },
        {
          text: 'Yes, help me',
          onPress: () => onSupportRequested?.('emergency'),
        },
      ]
    );
  }, [onSupportRequested]);

  // Crisis intervention icon (simple text-based for now)
  const getCrisisIcon = () => {
    switch (crisisLevel) {
      case 'low':
        return '⚠️';
      case 'medium':
        return '🚨';
      case 'high':
        return '🆘';
      default:
        return null;
    }
  };

  // Safety state icon
  const getSafetyIcon = () => {
    switch (safetyState) {
      case 'safe':
        return '🛡️';
      case 'caution':
        return '⚡';
      case 'concern':
        return '❤️';
      default:
        return '🛡️';
    }
  };

  if (!isActive) {
    return null;
  }

  const styles = createStyles(theme, currentTheme, crisisColor);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={
        accessibilityLabel ||
        `Safe space indicator. Current state: ${safetyState}. ${
          crisisLevel !== 'none' ? `Crisis level: ${crisisLevel}` : ''
        }`
      }
    >
      {/* Main Safety Indicator */}
      <View style={styles.mainIndicator}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon} accessibilityElementsHidden>
            {getSafetyIcon()}
          </Text>
          {crisisLevel !== 'none' && (
            <Text style={styles.crisisIcon} accessibilityElementsHidden>
              {getCrisisIcon()}
            </Text>
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>
            {message || getDefaultMessage()}
          </Text>
          
          {crisisLevel !== 'none' && (
            <Text style={styles.crisisText}>
              Support resources are available
            </Text>
          )}
        </View>
      </View>

      {/* Control Buttons */}
      {showControls && (
        <View style={styles.controls}>
          <Pressable
            style={styles.controlButton}
            onPress={handlePauseRequest}
            accessibilityRole="button"
            accessibilityLabel="Pause conversation"
            accessibilityHint="Temporarily pause the current conversation"
          >
            <Text style={styles.controlButtonText}>⏸️ Pause</Text>
          </Pressable>

          <Pressable
            style={styles.controlButton}
            onPress={handleBreakRequest}
            accessibilityRole="button"
            accessibilityLabel="Take a break"
            accessibilityHint="Take a longer break from the conversation"
          >
            <Text style={styles.controlButtonText}>☕ Break</Text>
          </Pressable>

          <Pressable
            style={[styles.controlButton, styles.supportButton]}
            onPress={toggleSupportOptions}
            accessibilityRole="button"
            accessibilityLabel="Emotional support options"
            accessibilityHint="Show additional emotional support options"
          >
            <Text style={styles.controlButtonText}>
              💚 Support {showSupportOptions ? '▲' : '▼'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Expanded Support Options */}
      {(showDetailedSupport || showSupportOptions) && (
        <Animated.View
          style={[
            styles.supportOptions,
            {
              maxHeight: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
              opacity: expandAnim,
            },
          ]}
        >
          <Pressable
            style={styles.supportOption}
            onPress={handleBreathingExercise}
            accessibilityRole="button"
            accessibilityLabel="Breathing exercise"
          >
            <Text style={styles.supportOptionText}>🫁 Breathing Exercise</Text>
          </Pressable>

          <Pressable
            style={styles.supportOption}
            onPress={handleResourcesRequest}
            accessibilityRole="button"
            accessibilityLabel="Emotional resources"
          >
            <Text style={styles.supportOptionText}>📚 Resources</Text>
          </Pressable>

          {crisisLevel !== 'none' && (
            <Pressable
              style={[styles.supportOption, styles.emergencyOption]}
              onPress={handleEmergencyResources}
              accessibilityRole="button"
              accessibilityLabel="Emergency support resources"
            >
              <Text style={[styles.supportOptionText, styles.emergencyText]}>
                🆘 Crisis Support
              </Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const createStyles = (theme: any, currentTheme: any, crisisColor: string | null) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.safety.safeSpace.backgroundColor,
      borderColor: currentTheme.color,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      margin: theme.spacing.sm,
      ...theme.shadows.base,
    },
    mainIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    icon: {
      fontSize: 20,
      marginRight: theme.spacing.xs,
    },
    crisisIcon: {
      fontSize: 16,
    },
    textContainer: {
      flex: 1,
    },
    statusText: {
      ...theme.typography.sizes.body,
      color: currentTheme.color,
      fontWeight: theme.typography.weights.medium,
    },
    crisisText: {
      ...theme.typography.sizes.caption,
      color: crisisColor || theme.colors.warning,
      marginTop: theme.spacing.xs,
      fontWeight: theme.typography.weights.semibold,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: currentTheme.color + '20',
    },
    controlButton: {
      backgroundColor: currentTheme.backgroundColor,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.base,
      minHeight: theme.safety.a11y.minTouchTarget,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.color + '30',
    },
    supportButton: {
      backgroundColor: theme.colors.softPlum + '10',
      borderColor: theme.colors.softPlum + '50',
    },
    controlButtonText: {
      ...theme.typography.sizes.caption,
      color: currentTheme.color,
      fontWeight: theme.typography.weights.medium,
      textAlign: 'center',
    },
    supportOptions: {
      overflow: 'hidden',
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: currentTheme.color + '20',
    },
    supportOption: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.sm,
      marginVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.base,
      borderWidth: 1,
      borderColor: theme.colors.slateGray + '20',
      minHeight: theme.safety.a11y.minTouchTarget,
      justifyContent: 'center',
    },
    emergencyOption: {
      backgroundColor: theme.colors.error + '10',
      borderColor: theme.colors.error + '40',
    },
    supportOptionText: {
      ...theme.typography.sizes.body,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: theme.typography.weights.medium,
    },
    emergencyText: {
      color: theme.colors.error,
      fontWeight: theme.typography.weights.semibold,
    },
  });

export default SafeSpaceIndicator;