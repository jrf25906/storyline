import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@types/navigation';
import { useTheme } from '@context/ThemeContext';

// Screens
import ProfileScreen from '@screens/profile/ProfileScreen';
import SettingsScreen from '@screens/main/SettingsScreen';
import WellnessScreen from '@screens/main/WellnessScreen';
import AboutScreen from '@screens/profile/AboutScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
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
      }}
    >
      <Stack.Screen 
        name="ProfileOverview" 
        component={ProfileScreen}
        options={{ 
          headerShown: false,
          title: 'Profile',
          headerAccessibilityLabel: 'User profile screen',
        }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: 'Settings',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'App settings screen',
        }} 
      />
      <Stack.Screen 
        name="Wellness" 
        component={WellnessScreen} 
        options={{ 
          title: 'Wellness',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Wellness tracking screen',
        }} 
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ 
          title: 'About',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'About the app screen',
        }} 
      />
    </Stack.Navigator>
  );
}