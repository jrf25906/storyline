import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, Typography } from '../../theme';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;

  return (
    <View 
      style={[styles.container, style]} 
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${description || ''}`}
    >
      <Text style={styles.icon} accessibilityLabel={`${icon} icon`}>
        {icon}
      </Text>
      <Text 
        style={[
          styles.title, 
          { color: isDark ? Colors.dark.textPrimary : Colors.textPrimary }
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text 
          style={[
            styles.description, 
            { color: isDark ? Colors.dark.textSecondary : Colors.textSecondary }
          ]}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="medium"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSizes.body,
    textAlign: 'center',
    lineHeight: Typography.fontSizes.body * Typography.lineHeights.relaxed,
    marginBottom: Spacing.lg,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: Spacing.xs,
  },
});