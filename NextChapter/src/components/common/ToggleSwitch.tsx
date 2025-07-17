import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

export interface ToggleSwitchProps {
  value: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'gentle';
  size?: 'small' | 'medium' | 'large';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onToggle,
  label,
  description,
  disabled = false,
  variant = 'default',
  size = 'medium',
  accessibilityLabel,
  accessibilityHint,
}) => {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;
  const backgroundColor = useRef(new Animated.Value(value ? 1 : 0)).current;

  const switchDimensions = getSwitchDimensions(size);
  const variantColors = getVariantColors(variant);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(backgroundColor, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, translateX, backgroundColor]);

  const handleToggle = () => {
    if (disabled) return;
    onToggle(!value);
  };

  const thumbTranslateX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [2, switchDimensions.width - switchDimensions.thumbSize - 2],
  });

  const trackColor = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      disabled ? Colors.background.disabled : Colors.border.medium,
      disabled ? Colors.background.disabled : variantColors.active,
    ],
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.containerDisabled,
      ]}
      onPress={handleToggle}
      disabled={disabled}
      accessible
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={[
          styles.track,
          switchDimensions,
          { backgroundColor: trackColor },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: switchDimensions.thumbSize,
              height: switchDimensions.thumbSize,
              transform: [{ translateX: thumbTranslateX }],
            },
            disabled && styles.thumbDisabled,
          ]}
        />
      </Animated.View>

      {(label || description) && (
        <View style={styles.textContainer}>
          {label && (
            <Text
              style={[
                styles.label,
                size === 'small' && styles.labelSmall,
                size === 'large' && styles.labelLarge,
                disabled && styles.labelDisabled,
              ]}
            >
              {label}
            </Text>
          )}
          {description && (
            <Text
              style={[
                styles.description,
                size === 'small' && styles.descriptionSmall,
                disabled && styles.descriptionDisabled,
              ]}
            >
              {description}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

function getSwitchDimensions(size: ToggleSwitchProps['size']) {
  switch (size) {
    case 'small':
      return { width: 40, height: 22, thumbSize: 18 };
    case 'large':
      return { width: 60, height: 32, thumbSize: 28 };
    default:
      return { width: 50, height: 28, thumbSize: 24 };
  }
}

function getVariantColors(variant: ToggleSwitchProps['variant']) {
  switch (variant) {
    case 'success':
      return {
        active: Colors.success.main,
      };
    case 'gentle':
      return {
        active: Colors.primary.light,
      };
    default:
      return {
        active: Colors.primary.main,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48, // Accessibility minimum touch target
  },
  containerDisabled: {
    opacity: 0.6,
  },
  track: {
    borderRadius: 50,
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  thumb: {
    backgroundColor: Colors.background.primary,
    borderRadius: 50,
    shadowColor: Colors.neutral.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbDisabled: {
    backgroundColor: Colors.background.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  labelSmall: {
    ...Typography.body.small,
  },
  labelLarge: {
    ...Typography.body.large,
  },
  labelDisabled: {
    color: Colors.text.disabled,
  },
  description: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  descriptionSmall: {
    fontSize: 11,
  },
  descriptionDisabled: {
    color: Colors.text.disabled,
  },
});