import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { ToggleSwitch } from '@components/common';
import { Spacing } from '@theme/spacing';
import { Typography } from '@theme/typography';

export const ThemeSettingsScreen: React.FC = () => {
  const { theme, themeType, setThemeType, isHighContrast, setIsHighContrast } = useTheme();

  const handleThemeToggle = (isDark: boolean) => {
    setThemeType(isDark ? 'dark' : 'light');
  };

  const handleSystemToggle = (followSystem: boolean) => {
    setThemeType(followSystem ? 'system' : 'light');
  };

  const handleHighContrastToggle = (enabled: boolean) => {
    setIsHighContrast(enabled);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Appearance
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
            Customize how the app looks to support your comfort and accessibility needs.
          </Text>
        </View>

        <View style={[styles.settingCard, { backgroundColor: theme.colors.background.secondary }]}>
          <ToggleSwitch
            label="Dark Mode"
            description="Use dark appearance throughout the app"
            value={themeType === 'dark'}
            onToggle={handleThemeToggle}
            variant="gentle"
            accessibilityLabel="Toggle dark mode"
            accessibilityHint="Switches between light and dark appearance"
          />
        </View>

        <View style={[styles.settingCard, { backgroundColor: theme.colors.background.secondary }]}>
          <ToggleSwitch
            label="Follow System"
            description="Automatically switch based on your device settings"
            value={themeType === 'system'}
            onToggle={handleSystemToggle}
            variant="gentle"
            accessibilityLabel="Follow system theme"
            accessibilityHint="Uses your device's dark or light mode setting"
          />
        </View>

        <View style={[styles.settingCard, { backgroundColor: theme.colors.background.secondary }]}>
          <ToggleSwitch
            label="High Contrast"
            description="Increase contrast for better visibility and accessibility"
            value={isHighContrast}
            onToggle={handleHighContrastToggle}
            variant="gentle"
            accessibilityLabel="Toggle high contrast"
            accessibilityHint="Increases text and background contrast for better visibility"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.helpText, { color: theme.colors.text.tertiary }]}>
            Theme changes take effect immediately. Your preference is automatically saved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.body.medium,
    lineHeight: 20,
  },
  settingCard: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  helpText: {
    ...Typography.body.small,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.md,
  },
});