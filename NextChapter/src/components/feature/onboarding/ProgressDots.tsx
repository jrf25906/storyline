import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Motion } from '@theme';

interface ProgressDotsProps {
  total: number;
  current: number;
  style?: any;
  testID?: string;
}

export default function ProgressDots({ total, current, style, testID }: ProgressDotsProps) {
  const animatedValues = useRef(
    Array.from({ length: total }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Animate dots based on current progress
    animatedValues.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index < current ? 1 : 0,
        duration: Motion.duration.standard,
        useNativeDriver: false,
      }).start();
    });
  }, [current, animatedValues]);

  const renderDot = (index: number) => {
    const isActive = index < current;
    const isCurrent = index === current - 1;
    const animatedValue = animatedValues[index];

    const dotBackgroundColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.border, Colors.primary],
    });

    const dotScale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: dotBackgroundColor,
            transform: isCurrent ? [{ scale: dotScale }] : [],
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          now: index + 1,
          max: total,
        }}
        accessibilityLabel={`Step ${index + 1} of ${total}${isActive ? ', completed' : ''}`}
      />
    );
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {Array.from({ length: total }, (_, i) => renderDot(i))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});