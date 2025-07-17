import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../theme';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
  testID?: string;
}

export default function LoadingIndicator({
  size = 'large',
  color,
  message,
  style,
  testID,
}: LoadingIndicatorProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;
  
  const indicatorColor = color || theme.colors.primary;

  return (
    <View 
      style={[styles.container, style]} 
      testID={testID}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={message || "Loading"}
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator 
        size={size} 
        color={indicatorColor}
        accessibilityLabel="Loading indicator"
      />
      {message && (
        <Text 
          style={[
            styles.message, 
            { color: isDark ? Colors.dark.textSecondary : Colors.textSecondary }
          ]}
          accessible={true}
          accessibilityRole="text"
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  message: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSizes.bodySM,
    textAlign: 'center',
  },
});