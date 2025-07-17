import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TextInputProps, 
  ViewStyle, 
  Animated,
  Platform 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography, Borders, Shadows } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
}

export default function Input({
  label,
  error,
  hint,
  required = false,
  containerStyle,
  style,
  testID,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;
  const [isFocused, setIsFocused] = useState(false);
  
  // Animation values for smooth transitions
  const animatedBorderColor = useRef(new Animated.Value(0)).current;
  const animatedShadowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate border color and shadow on focus change
    Animated.parallel([
      Animated.timing(animatedBorderColor, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedShadowOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused, animatedBorderColor, animatedShadowOpacity]);

  const getBorderColor = () => {
    if (error) return Colors.gentleCoral;
    if (isFocused) return Colors.primary;
    return isDark ? Colors.dark.border : Colors.border;
  };

  const getBackgroundColor = () => {
    if (props.editable === false) {
      return isDark ? Colors.dark.surface : Colors.neutral[100];
    }
    return isDark ? Colors.dark.surfaceVariant : Colors.surface;
  };

  const interpolatedBorderColor = animatedBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.gentleCoral : (isDark ? Colors.dark.border : Colors.border),
      error ? Colors.gentleCoral : Colors.primary,
    ],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        containerStyle,
        isFocused && styles.containerFocused,
        {
          shadowOpacity: animatedShadowOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Shadows.focus.shadowOpacity],
          }),
        },
      ]} 
      testID={testID}
    >
      {label && (
        <View style={styles.labelContainer}>
          <Text 
            style={[
              styles.label, 
              { color: isDark ? Colors.dark.textPrimary : Colors.textPrimary }
            ]}
            accessibilityRole="text"
          >
            {label}
          </Text>
          {required && (
            <Text style={[styles.required, { color: Colors.error }]}>
              *
            </Text>
          )}
        </View>
      )}
      <Animated.View style={{ position: 'relative' }}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: getBackgroundColor(),
              color: isDark ? Colors.dark.textPrimary : Colors.textPrimary,
              borderColor: interpolatedBorderColor,
            },
            props.multiline && styles.multilineInput,
            props.editable === false && styles.disabledInput,
            style
          ]}
          placeholderTextColor={isDark ? Colors.dark.textTertiary : Colors.textTertiary}
          accessible={true}
          accessibilityLabel={props.accessibilityLabel || label}
          accessibilityHint={props.accessibilityHint || hint}
          accessibilityRole="text"
          accessibilityState={{
            disabled: props.editable === false,
            selected: isFocused,
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {/* Custom italic placeholder overlay for empty inputs */}
        {!props.value && props.placeholder && !isFocused && (
          <Text 
            style={[
              styles.placeholderOverlay,
              {
                color: isDark ? Colors.dark.textTertiary : Colors.textTertiary,
              }
            ]}
            pointerEvents="none"
          >
            {props.placeholder}
          </Text>
        )}
      </Animated.View>
      {hint && !error && (
        <Text 
          style={[
            styles.hint, 
            { color: isDark ? Colors.dark.textSecondary : Colors.textSecondary }
          ]}
          accessibilityRole="text"
        >
          {hint}
        </Text>
      )}
      {error && (
        <Text 
          style={[styles.error, { color: Colors.gentleCoral }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    // Shadow setup for focus state
    ...Shadows.focus,
    shadowOpacity: 0, // Will be animated
  },
  containerFocused: {
    // Additional styles when focused
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
  },
  required: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
    marginLeft: Spacing.xxs,
  },
  input: {
    minHeight: Spacing.minTouchTarget,
    borderRadius: Borders.radius.md, // 8px as specified
    paddingHorizontal: 16, // 16px padding as specified
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSizes.body,
    borderWidth: 2, // 2px border as specified
    fontStyle: 'normal', // Normal style for input text
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    textAlignVertical: 'top',
  },
  disabledInput: {
    opacity: 0.6,
  },
  hint: {
    fontSize: Typography.fontSizes.bodySM,
    marginTop: Spacing.xxs,
  },
  error: {
    fontSize: Typography.fontSizes.bodySM,
    marginTop: Spacing.xxs,
    fontWeight: Typography.fontWeights.medium,
  },
  placeholderOverlay: {
    position: 'absolute',
    left: 16, // Match input padding
    top: Platform.OS === 'ios' ? 15 : 13, // Adjust for platform differences
    fontStyle: 'italic',
    fontSize: Typography.fontSizes.body,
  },
});