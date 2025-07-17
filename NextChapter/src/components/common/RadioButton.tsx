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

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioButtonProps {
  options: RadioOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  variant?: 'default' | 'gentle' | 'supportive';
  size?: 'small' | 'medium' | 'large';
  direction?: 'vertical' | 'horizontal';
  accessibilityLabel?: string;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  options,
  selectedValue,
  onSelect,
  variant = 'default',
  size = 'medium',
  direction = 'vertical',
  accessibilityLabel,
}) => {
  return (
    <View
      style={[
        styles.container,
        direction === 'horizontal' && styles.containerHorizontal,
      ]}
      accessible
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option, index) => (
        <RadioOption
          key={option.value}
          option={option}
          selected={selectedValue === option.value}
          onSelect={() => onSelect(option.value)}
          variant={variant}
          size={size}
          isLast={index === options.length - 1}
          direction={direction}
        />
      ))}
    </View>
  );
};

interface RadioOptionProps {
  option: RadioOption;
  selected: boolean;
  onSelect: () => void;
  variant: RadioButtonProps['variant'];
  size: RadioButtonProps['size'];
  isLast: boolean;
  direction: RadioButtonProps['direction'];
}

const RadioOption: React.FC<RadioOptionProps> = ({
  option,
  selected,
  onSelect,
  variant,
  size,
  isLast,
  direction,
}) => {
  const { animate, animatedStyle } = useTaskCompleteAnimation({
    onComplete: () => {
      // Gentle feedback for selection
    },
  });

  const handleSelect = () => {
    if (option.disabled) return;
    
    onSelect();
    if (!selected) {
      animate();
    }
  };

  const radioSize = getRadioSize(size);
  const variantColors = getVariantColors(variant);

  return (
    <TouchableOpacity
      style={[
        styles.optionContainer,
        !isLast && direction === 'vertical' && styles.optionContainerSpacing,
        !isLast && direction === 'horizontal' && styles.optionContainerSpacingHorizontal,
        option.disabled && styles.optionContainerDisabled,
      ]}
      onPress={handleSelect}
      disabled={option.disabled}
      accessible
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: option.disabled }}
      accessibilityLabel={option.label}
      accessibilityHint={option.description}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={[
          styles.radio,
          radioSize,
          animatedStyle,
          {
            borderColor: selected 
              ? variantColors.selected 
              : (option.disabled ? Colors.border.light : Colors.border.medium),
          },
          option.disabled && styles.radioDisabled,
        ]}
      >
        {selected && (
          <Animated.View
            style={[
              styles.radioInner,
              {
                backgroundColor: variantColors.selected,
                width: radioSize.width * 0.5,
                height: radioSize.height * 0.5,
                borderRadius: radioSize.width * 0.25,
              },
              animatedStyle,
            ]}
          />
        )}
      </Animated.View>

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.label,
            size === 'small' && styles.labelSmall,
            size === 'large' && styles.labelLarge,
            option.disabled && styles.labelDisabled,
          ]}
        >
          {option.label}
        </Text>
        {option.description && (
          <Text
            style={[
              styles.description,
              size === 'small' && styles.descriptionSmall,
              option.disabled && styles.descriptionDisabled,
            ]}
          >
            {option.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

function getRadioSize(size: RadioButtonProps['size']) {
  switch (size) {
    case 'small':
      return { width: 18, height: 18 };
    case 'large':
      return { width: 28, height: 28 };
    default:
      return { width: 22, height: 22 };
  }
}

function getVariantColors(variant: RadioButtonProps['variant']) {
  switch (variant) {
    case 'gentle':
      return {
        selected: Colors.primary.light,
      };
    case 'supportive':
      return {
        selected: Colors.success.main,
      };
    default:
      return {
        selected: Colors.primary.main,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    // Default vertical layout
  },
  containerHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48, // Accessibility minimum touch target
  },
  optionContainerSpacing: {
    marginBottom: Spacing.md,
  },
  optionContainerSpacingHorizontal: {
    marginRight: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  optionContainerDisabled: {
    opacity: 0.6,
  },
  radio: {
    borderWidth: 2,
    borderRadius: 50, // Always circular
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2, // Align with text baseline
    backgroundColor: Colors.background.secondary,
  },
  radioDisabled: {
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.disabled,
  },
  radioInner: {
    // Dynamic styles applied inline
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
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