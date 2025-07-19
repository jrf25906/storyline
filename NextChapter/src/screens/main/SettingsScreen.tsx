import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { withErrorBoundary, Container, DashboardCard } from '@components/common';
import { H1, H2, Body, BodySM, Caption } from '@components/common/Typography';

function SettingsScreen() {
  const { theme } = useTheme();

  const settingsOptions = [
    {
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: 'notifications-outline',
      onPress: () => console.log('Notifications pressed'),
    },
    {
      title: 'Privacy & Security',
      description: 'Control your data and privacy settings',
      icon: 'shield-checkmark-outline',
      onPress: () => console.log('Privacy pressed'),
    },
    {
      title: 'Theme',
      description: 'Choose your preferred app appearance',
      icon: 'color-palette-outline',
      onPress: () => console.log('Theme pressed'),
    },
    {
      title: 'Data & Storage',
      description: 'Manage your app data and storage',
      icon: 'server-outline',
      onPress: () => console.log('Data pressed'),
    },
    {
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help-circle-outline',
      onPress: () => console.log('Help pressed'),
    },
  ];

  return (
    <Container variant="fullscreen">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <H1 style={{ color: theme.colors.text }}>Settings</H1>
            <Caption style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
              Customize your app experience
            </Caption>
          </View>

          {/* Settings Options */}
          <View style={styles.settingsSection}>
            {settingsOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={option.onPress}
                style={[
                  styles.settingItem,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${option.title}. ${option.description}`}
              >
                <View style={styles.settingContent}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Body style={{ color: theme.colors.text, fontWeight: '500' }}>
                      {option.title}
                    </Body>
                    <BodySM style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
                      {option.description}
                    </BodySM>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* App Info */}
          <View style={styles.appInfoSection}>
            <DashboardCard
              title="App Information"
              subtitle="Version and details"
              variant="gentle"
            >
              <View style={styles.appInfo}>
                <Body style={{ color: theme.colors.text }}>Next Chapter</Body>
                <Caption style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                  Version 1.0.0
                </Caption>
                <Caption style={{ color: theme.colors.textSecondary, marginTop: 2 }}>
                  Your career transition companion
                </Caption>
              </View>
            </DashboardCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  settingItem: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  appInfoSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});

export default withErrorBoundary(SettingsScreen, {
  errorMessage: {
    title: 'Unable to load settings',
    message: "We're having trouble accessing your settings. Please try again."
  }
});