import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography, Borders } from '../../theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'gentle';
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  label,
  disabled = false,
  variant = 'default',
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 300,
      friction: 8,
    }).start();
  }, [value, animatedValue]);

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          activeColor: Colors.successMint,
          inactiveColor: Colors.muted,
        };
      case 'gentle':
        return {
          activeColor: Colors.gentleCoral,
          inactiveColor: Colors.muted,
        };
      default:
        return {
          activeColor: Colors.primary,
          inactiveColor: Colors.muted,
        };
    }
  };

  const { activeColor, inactiveColor } = getVariantColors();

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.switch,
          disabled && styles.disabled,
        ]}
        accessible={true}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        <Animated.View
          style={[
            styles.track,
            { backgroundColor: trackColor },
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX: thumbTranslateX }],
                backgroundColor: Colors.white,
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56, // Comfortable touch target
  },
  switch: {
    marginRight: Spacing.sm,
  },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.regular,
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});