import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography, Borders } from '../../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  showLabel?: boolean;
  label?: string;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  testID?: string;
  animated?: boolean;
}

export default function ProgressBar({
  progress,
  height = 8,
  showLabel = false,
  label,
  color,
  backgroundColor,
  style,
  testID,
  animated = true,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animated, animatedProgress]);

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const progressPercentage = Math.round(clampedProgress * 100);
  
  const barColor = color || Colors.primary;
  const barBackgroundColor = backgroundColor || (isDark ? Colors.dark.border : Colors.neutral[200]);

  const progressWidth = animated
    ? animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      })
    : `${progressPercentage}%`;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text 
              style={[
                styles.label,
                { color: isDark ? Colors.dark.textPrimary : Colors.textPrimary }
              ]}
              accessible={true}
              accessibilityRole="text"
            >
              {label}
            </Text>
          )}
          {showLabel && (
            <Text 
              style={[
                styles.percentage,
                { color: isDark ? Colors.dark.textSecondary : Colors.textSecondary }
              ]}
              accessible={true}
              accessibilityRole="text"
            >
              {progressPercentage}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: barBackgroundColor,
          },
        ]}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progressPercentage,
        }}
        accessibilityLabel={`Progress: ${progressPercentage}%`}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressWidth,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSizes.bodySM,
    fontWeight: Typography.fontWeights.medium,
  },
  percentage: {
    fontSize: Typography.fontSizes.bodySM,
    fontWeight: Typography.fontWeights.medium,
  },
  track: {
    width: '100%',
    borderRadius: Borders.radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Borders.radius.full,
  },
});