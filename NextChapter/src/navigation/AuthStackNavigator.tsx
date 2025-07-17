import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

// Screens
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LayoffDetailsScreen from '../screens/onboarding/LayoffDetailsScreen';
import PersonalInfoScreen from '../screens/onboarding/PersonalInfoScreen';
import GoalsScreen from '../screens/onboarding/GoalsScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
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
        name="Welcome" 
        component={WelcomeScreen} 
        options={{ 
          headerShown: false,
          title: 'Welcome',
          headerAccessibilityLabel: 'Welcome screen',
        }} 
      />
      <Stack.Screen 
        name="LayoffDetails" 
        component={LayoffDetailsScreen} 
        options={{ 
          title: 'Your Situation',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Layoff details screen',
        }} 
      />
      <Stack.Screen 
        name="PersonalInfo" 
        component={PersonalInfoScreen} 
        options={{ 
          title: 'About You',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Personal information screen',
        }} 
      />
      <Stack.Screen 
        name="Goals" 
        component={GoalsScreen} 
        options={{ 
          title: 'Your Goals',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Goals setup screen',
        }} 
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ 
          title: 'Sign In',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Login screen',
        }} 
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{ 
          title: 'Create Account',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Sign up screen',
        }} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ 
          title: 'Reset Password',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Forgot password screen',
        }} 
      />
    </Stack.Navigator>
  );
}