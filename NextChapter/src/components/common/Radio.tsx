import React from 'react';
import { 
  TouchableOpacity, 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle,
  Animated
} from 'react-native';
import { Colors, Spacing, Typography, Borders } from '@theme';
import { useTheme } from '@context/ThemeContext';

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioProps {
  options: RadioOption[];
  value?: string;
  onValueChange: (value: string) => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export default function Radio({
  options,
  value,
  onValueChange,
  style,
  accessibilityLabel,
  testID
}: RadioProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;

  const renderOption = (option: RadioOption) => {
    const isSelected = value === option.value;
    const isDisabled = option.disabled;

    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.option,
          {
            backgroundColor: isDark ? Colors.dark.surface : Colors.surface,
            borderColor: isSelected 
              ? Colors.primary 
              : (isDark ? Colors.dark.border : Colors.border),
            borderWidth: isSelected ? 2 : 1,
          },
          isDisabled && styles.optionDisabled,
        ]}
        onPress={() => !isDisabled && onValueChange(option.value)}
        disabled={isDisabled}
        accessibilityRole="radio"
        accessibilityState={{
          checked: isSelected,
          disabled: isDisabled,
        }}
        accessibilityLabel={`${option.label}${isSelected ? ', selected' : ''}`}
        activeOpacity={0.7}
      >
        <View style={styles.radioContainer}>
          <View 
            style={[
              styles.radioOuter,
              {
                borderColor: isSelected 
                  ? Colors.primary 
                  : (isDark ? Colors.dark.textSecondary : Colors.textSecondary),
              },
              isDisabled && styles.radioDisabled,
            ]}
          >
            {isSelected && (
              <View 
                style={[
                  styles.radioInner,
                  {
                    backgroundColor: isDisabled 
                      ? Colors.textTertiary 
                      : Colors.primary,
                  }
                ]}
              />
            )}
          </View>
          <Text 
            style={[
              styles.label,
              {
                color: isDisabled 
                  ? Colors.textTertiary 
                  : (isDark ? Colors.dark.textPrimary : Colors.textPrimary),
              }
            ]}
          >
            {option.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View 
      style={[styles.container, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {options.map(renderOption)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  option: {
    borderRadius: Borders.radius.md,
    padding: Spacing.lg,
    minHeight: Spacing.comfortableTouchTarget,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.regular,
    flex: 1,
  },
});