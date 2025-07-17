import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Theme } from '../theme';

/**
 * Default stack navigation options
 */
export const defaultStackScreenOptions = (theme: Theme): NativeStackNavigationOptions => ({
  headerStyle: {
    backgroundColor: theme.colors.background,
  },
  headerTintColor: theme.colors.text,
  headerTitleStyle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.semibold,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: theme.colors.background,
  },
  headerBackTitle: 'Back',
  animation: 'default',
});

/**
 * Modal presentation options
 */
export const modalScreenOptions = (theme: Theme): NativeStackNavigationOptions => ({
  ...defaultStackScreenOptions(theme),
  presentation: 'modal',
  headerStyle: {
    backgroundColor: theme.colors.surface,
  },
});

/**
 * Full screen modal options (no header)
 */
export const fullScreenModalOptions = (theme: Theme): NativeStackNavigationOptions => ({
  ...modalScreenOptions(theme),
  headerShown: false,
  presentation: 'fullScreenModal',
});

/**
 * Tab bar options
 */
export const defaultTabScreenOptions = (theme: Theme): BottomTabNavigationOptions => ({
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.textMuted,
  tabBarStyle: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.medium,
  },
  headerShown: false,
});

/**
 * Accessibility options for screens
 */
export const getAccessibilityOptions = (screenName: string): Partial<NativeStackNavigationOptions> => ({
  headerAccessibilityLabel: `${screenName} screen`,
  headerLargeTitle: false, // Large titles can be problematic for screen readers
});

/**
 * Platform-specific options
 */
export const getPlatformSpecificOptions = (): Partial<NativeStackNavigationOptions> => {
  if (Platform.OS === 'ios') {
    return {
      headerLargeTitleShadowVisible: false,
      headerBlurEffect: 'light',
    };
  }
  return {
    statusBarStyle: 'dark',
  };
};

// Import Platform
import { Platform } from 'react-native';