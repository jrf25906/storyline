// src/types/navigation.ts
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  LayoffDetails: undefined;
  Goals: undefined;
  SetupComplete: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  BouncePlan: undefined;
  Coach: undefined;
  Tracker: undefined;
  Budget: undefined;
  Wellness: undefined;
  Settings: undefined;
};

// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';

import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import TabNavigator from './TabNavigator';
import Loading from '../components/common/Loading';

import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, isLoading: authLoading } = useAuth();
  const { isOnboardingComplete, isLoading: onboardingLoading } = useOnboarding();

  if (authLoading || onboardingLoading) {
    return <Loading />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !isOnboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
}

// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../types/navigation';

// Screens - we'll create these as simple placeholder screens initially
import HomeScreen from '../screens/main/HomeScreen';
import BouncePlanScreen from '../screens/main/BouncePlanScreen';
import CoachScreen from '../screens/main/CoachScreen';
import TrackerScreen from '../screens/main/TrackerScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import WellnessScreen from '../screens/main/WellnessScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Icons - using MaterialIcons from react-native-vector-icons
import Icon from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

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

          return <Icon name={iconName} size={size} color={color} />;
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

// src/navigation/OnboardingNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { OnboardingStackParamList } from '../types/navigation';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LayoffDetailsScreen from '../screens/onboarding/LayoffDetailsScreen';
import GoalsScreen from '../screens/onboarding/GoalsScreen';
import SetupCompleteScreen from '../screens/onboarding/SetupCompleteScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTitleStyle: {
          fontSize: theme.typography.sizes.h3,
          fontWeight: theme.typography.weights.semibold,
          color: theme.colors.text,
        },
        headerBackTitleVisible: false,
        headerTintColor: theme.colors.primary,
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="LayoffDetails" 
        component={LayoffDetailsScreen} 
        options={{ title: 'About Your Situation' }} 
      />
      <Stack.Screen 
        name="Goals" 
        component={GoalsScreen} 
        options={{ title: 'Your Goals' }} 
      />
      <Stack.Screen 
        name="SetupComplete" 
        component={SetupCompleteScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}

// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}