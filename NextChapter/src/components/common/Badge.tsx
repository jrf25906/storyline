import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography, Borders, Motion } from '../../theme';

interface BadgeProps {
  value: string | number;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export default function Badge({
  value,
  variant = 'primary',
  size = 'small',
  style,
  textStyle,
  testID,
  accessibilityLabel,
}: BadgeProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const previousValue = useRef(value);

  // Don't render if value is 0 or empty string
  if (!value || value === 0) {
    return null;
  }

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Motion.duration.fast,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate on value change
  useEffect(() => {
    if (previousValue.current !== value) {
      // Pulse animation on value change
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: Motion.duration.fast / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: Motion.duration.fast / 2,
          useNativeDriver: true,
        }),
      ]).start();
      
      previousValue.current = value;
    }
  }, [value]);

  const getVariantColors = () => {
    const variantMap = {
      primary: {
        backgroundColor: Colors.primary,
        textColor: Colors.white,
      },
      secondary: {
        backgroundColor: Colors.secondary,
        textColor: Colors.white,
      },
      success: {
        backgroundColor: Colors.successMint,
        textColor: Colors.textPrimary, // Dark text for better contrast on mint
      },
      error: {
        backgroundColor: Colors.gentleCoral,
        textColor: Colors.white,
      },
      warning: {
        backgroundColor: Colors.warning, // Soft Amber
        textColor: Colors.textPrimary, // Dark text for better contrast
      },
      info: {
        backgroundColor: Colors.calmBlue,
        textColor: Colors.white,
      },
      neutral: {
        backgroundColor: isDark ? Colors.dark.surfaceVariant : Colors.neutral[200],
        textColor: isDark ? Colors.dark.textPrimary : Colors.textPrimary,
      },
    };

    return variantMap[variant] || variantMap.primary;
  };

  const getSizeStyles = () => {
    return size === 'small' 
      ? {
          badge: {
            paddingHorizontal: Spacing.xs,
            paddingVertical: Spacing.xxs,
            minHeight: 20,
          },
          text: {
            fontSize: Typography.fontSizes.caption,
          },
        }
      : {
          badge: {
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xxs,
            minHeight: 24,
          },
          text: {
            fontSize: Typography.fontSizes.bodySM,
          },
        };
  };

  const { backgroundColor, textColor } = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        styles.badge,
        sizeStyles.badge,
        { backgroundColor },
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel || `${variant} badge: ${value}`}
    >
      <Text 
        style={[
          styles.text,
          sizeStyles.text,
          { color: textColor },
          textStyle,
        ]}
      >
        {value}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Borders.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: Typography.fontWeights.semiBold,
    textAlign: 'center',
  },
});