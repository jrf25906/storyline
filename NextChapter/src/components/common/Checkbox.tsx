import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTaskCompleteAnimation } from '../../hooks/useAnimations';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

export interface CheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'gentle';
  size?: 'small' | 'medium' | 'large';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  error?: string;
  containerStyle?: any;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onToggle,
  label,
  description,
  disabled = false,
  variant = 'default',
  size = 'medium',
  accessibilityLabel,
  accessibilityHint,
  testID,
  error,
  containerStyle,
}) => {
  const { animate, animatedStyle, animatedColorStyle } = useTaskCompleteAnimation({
    originalColor: Colors.surfaceSection,
    completedColor: getVariantColor(variant),
    onComplete: () => {
      // Optional: Could trigger celebration for important checkboxes
    },
  });

  const handleToggle = () => {
    if (disabled) return;
    
    const newChecked = !checked;
    onToggle(newChecked);
    
    if (newChecked) {
      animate();
    }
  };

  const checkboxSize = getCheckboxSize(size);
  const variantColors = getVariantColors(variant);

  return (
    <View style={[styles.wrapper, containerStyle]} testID={testID}>
      <TouchableOpacity
        style={[
          styles.container,
          disabled && styles.containerDisabled,
        ]}
        onPress={handleToggle}
        disabled={disabled}
        accessible
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        testID={testID ? `${testID}-touchable` : 'checkbox-touchable'}
      >
      <Animated.View
        style={[
          styles.checkbox,
          checkboxSize,
          animatedStyle,
          {
            borderColor: checked 
              ? variantColors.checked 
              : (disabled ? Colors.neutral[200] : Colors.border),
            backgroundColor: checked 
              ? variantColors.checked 
              : Colors.surfaceSection,
          },
          animatedColorStyle,
          disabled && styles.checkboxDisabled,
        ]}
      >
        {checked && (
          <Animated.View style={[styles.checkmark, animatedStyle]}>
            <Text style={[styles.checkmarkText, { color: variantColors.checkmark }]}>
              ✓
            </Text>
          </Animated.View>
        )}
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
      
      {error && (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
};

function getCheckboxSize(size: CheckboxProps['size']) {
  switch (size) {
    case 'small':
      return { width: 18, height: 18 };
    case 'large':
      return { width: 28, height: 28 };
    default:
      return { width: 22, height: 22 };
  }
}

function getVariantColor(variant: CheckboxProps['variant']): string {
  switch (variant) {
    case 'success':
      return Colors.success;
    case 'warning':
      return Colors.warning;
    case 'gentle':
      return Colors.secondary;
    default:
      return Colors.primary;
  }
}

function getVariantColors(variant: CheckboxProps['variant']) {
  switch (variant) {
    case 'success':
      return {
        checked: Colors.success,
        checkmark: Colors.surface,
      };
    case 'warning':
      return {
        checked: Colors.warning,
        checkmark: Colors.surface,
      };
    case 'gentle':
      return {
        checked: Colors.secondary,
        checkmark: Colors.surface,
      };
    default:
      return {
        checked: Colors.primary,
        checkmark: Colors.surface,
      };
  }
}

const styles = StyleSheet.create({
  wrapper: {
    // Container for the entire checkbox component
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48, // Accessibility minimum touch target
  },
  containerDisabled: {
    opacity: 0.6,
  },
  checkbox: {
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2, // Align with text baseline
  },
  checkboxDisabled: {
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[100],
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: Typography.fontSizes.bodySM,
    fontWeight: Typography.fontWeights.regular,
  },
  labelLarge: {
    fontSize: Typography.fontSizes.bodyLG,
    fontWeight: Typography.fontWeights.medium,
  },
  labelDisabled: {
    color: Colors.textTertiary,
  },
  description: {
    fontSize: Typography.fontSizes.bodySM,
    fontWeight: Typography.fontWeights.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  descriptionSmall: {
    fontSize: 11,
  },
  descriptionDisabled: {
    color: Colors.textTertiary,
  },
  errorText: {
    fontSize: Typography.fontSizes.bodySM,
    fontWeight: Typography.fontWeights.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: 30, // Align with label text (checkbox width + margin)
  },
});