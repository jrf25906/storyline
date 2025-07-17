import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../types/navigation';
import { MaterialIcons } from '@expo/vector-icons';

// Stack Navigators
import BouncePlanStackNavigator from './BouncePlanStackNavigator';
import CoachStackNavigator from './CoachStackNavigator';
import TrackerStackNavigator from './TrackerStackNavigator';
import BudgetStackNavigator from './BudgetStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';

// Direct screen import for Home
import HomeScreen from '../screens/main/HomeScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 80, // Increased height for easier access
          paddingBottom: 16,
          paddingTop: 12,
          // Add subtle shadow for depth
          shadowColor: theme.colors.textPrimary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSizes.caption,
          fontWeight: theme.typography.fontWeights.medium,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarItemStyle: {
          minHeight: 56, // Comfortable touch target
        },
        headerShown: false, // We'll handle headers in the stack navigators
        // Accessibility
        tabBarAccessibilityLabel: `${route.name} tab`,
        tabBarTestID: `tab-${route.name.toLowerCase()}`,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="dashboard" size={28} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="BouncePlan" 
        component={BouncePlanStackNavigator} 
        options={{ 
          title: 'Plan',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="assignment" size={28} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Coach" 
        component={CoachStackNavigator} 
        options={{ 
          title: 'Coach',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="chat-bubble" size={26} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Tracker" 
        component={TrackerStackNavigator} 
        options={{ 
          title: 'Tools',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="work-outline" size={26} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Budget" 
        component={BudgetStackNavigator} 
        options={{ 
          title: 'Progress',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="trending-up" size={26} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        options={{ 
          title: 'More',
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="more-horiz" size={26} color={color} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}