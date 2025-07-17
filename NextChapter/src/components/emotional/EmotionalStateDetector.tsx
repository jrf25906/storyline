import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useEmotionalState } from '../../context/EmotionalStateContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Typography } from '../common/Typography';
import { Colors, Spacing } from '../../theme';

interface EmotionalStateDetectorProps {
  children: React.ReactNode;
  showIndicator?: boolean;
}

/**
 * Enhanced Emotional State Detector
 * Monitors user behavior and adapts UI accordingly
 * Part of Phase 3: Advanced Emotional Intelligence
 */
export function EmotionalStateDetector({ 
  children, 
  showIndicator = false 
}: EmotionalStateDetectorProps) {
  const { 
    emotionalState, 
    autoDetectedState, 
    stressLevel, 
    recentAchievements,
    isAutoDetectionEnabled 
  } = useEmotionalState();
  
  const { announceForAccessibility } = useAccessibility();
  const [previousState, setPreviousState] = useState(emotionalState);

  // Announce state changes for accessibility
  useEffect(() => {
    if (emotionalState !== previousState) {
      const stateMessages = {
        crisis: 'Crisis support mode activated. Simplified interface enabled.',
        success: 'Success mode activated. Celebrating your achievements!',
        struggling: 'Support mode activated. Extra guidance available.',
        normal: 'Normal mode active.'
      };

      announceForAccessibility(stateMessages[emotionalState]);
      setPreviousState(emotionalState);
    }
  }, [emotionalState, previousState, announceForAccessibility]);

  // Announce achievements
  useEffect(() => {
    if (recentAchievements.length > 0) {
      const latestAchievement = recentAchievements[0];
      announceForAccessibility(`Achievement unlocked: ${latestAchievement}`);
    }
  }, [recentAchievements, announceForAccessibility]);

  const getStateIndicatorColor = () => {
    switch (emotionalState) {
      case 'crisis': return Colors.error;
      case 'success': return Colors.success;
      case 'struggling': return Colors.warning;
      default: return Colors.primary;
    }
  };

  const getStateDescription = () => {
    switch (emotionalState) {
      case 'crisis':
        return 'Crisis Support Active - Simplified interface with larger touch targets';
      case 'success':
        return 'Success Mode - Celebrating your progress!';
      case 'struggling':
        return 'Support Mode - Extra guidance and encouragement';
      default:
        return 'Normal Mode - Standard interface';
    }
  };

  return (
    <View style={styles.container}>
      {showIndicator && isAutoDetectionEnabled && (
        <View 
          style={[styles.indicator, { backgroundColor: getStateIndicatorColor() }]}
          accessibilityRole="status"
          accessibilityLabel={getStateDescription()}
          accessibilityLiveRegion="polite"
        >
          <Typography 
            variant="caption" 
            style={styles.indicatorText}
            accessibilityLabel={`Current emotional state: ${emotionalState}. Stress level: ${stressLevel} out of 10.`}
          >
            {emotionalState.toUpperCase()} MODE
          </Typography>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: 8,
    zIndex: 1000,
  },
  indicatorText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});