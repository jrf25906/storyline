import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, ViewStyle } from 'react-native';
import { styles } from './NotificationBadge.styles';

interface NotificationBadgeProps {
  count: number;
  style?: ViewStyle;
  animated?: boolean;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  style,
  animated = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated && count > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, count, pulseAnim]);

  if (count <= 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : count.toString();

  const animatedStyle = animated
    ? {
        transform: [{ scale: pulseAnim }],
      }
    : {};

  return (
    <Animated.View
      testID="notification-badge"
      style={[styles.badge, style, animatedStyle]}
      accessibilityRole="text"
      accessibilityLabel={`${count} notifications`}
    >
      <Text style={styles.count}>{displayCount}</Text>
    </Animated.View>
  );
};