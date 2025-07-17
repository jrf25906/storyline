import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSlideInAnimation, useFadeInAnimation } from '../hooks/useAnimations';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

export interface ToastProps {
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss?: () => void;
  visible: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  duration = 3000,
  onDismiss,
  visible,
}) => {
  const insets = useSafeAreaInsets();
  const { animate: slideAnimate, animatedStyle: slideStyle, reset: slideReset } = useSlideInAnimation({
    duration: 300,
  });
  const { animate: fadeAnimate, fadeOut, animatedStyle: fadeStyle } = useFadeInAnimation({
    duration: 200,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      slideReset();
      slideAnimate();
      fadeAnimate();

      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleDismiss();
        }, duration);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, slideAnimate, fadeAnimate, slideReset]);

  const handleDismiss = () => {
    fadeOut();
    setTimeout(() => {
      onDismiss?.();
    }, 200);
  };

  if (!visible) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: Colors.success.light,
          borderColor: Colors.success.main,
          textColor: Colors.success.dark,
        };
      case 'error':
        return {
          backgroundColor: Colors.error.light,
          borderColor: Colors.error.main,
          textColor: Colors.error.dark,
        };
      case 'warning':
        return {
          backgroundColor: Colors.warning.light,
          borderColor: Colors.warning.main,
          textColor: Colors.warning.dark,
        };
      default:
        return {
          backgroundColor: Colors.primary.light,
          borderColor: Colors.primary.main,
          textColor: Colors.primary.dark,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + Spacing.md },
        slideStyle,
        fadeStyle,
      ]}
    >
      <TouchableOpacity
        onPress={handleDismiss}
        style={[
          styles.toast,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
          },
        ]}
        activeOpacity={0.9}
      >
        <Text
          style={[
            styles.message,
            { color: variantStyles.textColor },
          ]}
        >
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: SCREEN_WIDTH - (Spacing.md * 2),
    shadowColor: Colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  message: {
    ...Typography.body.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
});