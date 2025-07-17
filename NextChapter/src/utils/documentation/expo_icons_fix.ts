// src/navigation/TabNavigator.tsx (Updated with Expo Vector Icons)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../types/navigation';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import BouncePlanScreen from '../screens/main/BouncePlanScreen';
import CoachScreen from '../screens/main/CoachScreen';
import TrackerScreen from '../screens/main/TrackerScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import WellnessScreen from '../screens/main/WellnessScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Using Expo Vector Icons instead of react-native-vector-icons (easier setup)
import { MaterialIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'BouncePlan':
              iconName = 'today';
              break;
            case 'Coach':
              iconName = 'chat';
              break;
            case 'Tracker':
              iconName = 'work';
              break;
            case 'Budget':
              iconName = 'account-balance-wallet';
              break;
            case 'Wellness':
              iconName = 'favorite';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
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
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: theme.typography.sizes.h3,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text,
        },
        // Accessibility
        tabBarAccessibilityLabel: route.name,
        tabBarTestID: `tab-${route.name.toLowerCase()}`,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="BouncePlan" component={BouncePlanScreen} options={{ title: 'Bounce Plan' }} />
      <Tab.Screen name="Coach" component={CoachScreen} options={{ title: 'Coach' }} />
      <Tab.Screen name="Tracker" component={TrackerScreen} options={{ title: 'Job Tracker' }} />
      <Tab.Screen name="Budget" component={BudgetScreen} options={{ title: 'Budget' }} />
      <Tab.Screen name="Wellness" component={WellnessScreen} options={{ title: 'Wellness' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}