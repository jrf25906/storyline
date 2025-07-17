import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

// Screens
import CoachScreen from '../screens/main/CoachScreen';

const Stack = createNativeStackNavigator<CoachStackParamList>();

export default function CoachStackNavigator() {
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
        name="CoachChat" 
        component={CoachScreen} 
        options={{ 
          headerShown: false,
          title: 'AI Coach',
          headerAccessibilityLabel: 'AI coach chat screen',
        }} 
      />
      <Stack.Screen 
        name="CoachHistory" 
        component={CoachScreen} // TODO: Create CoachHistoryScreen
        options={{ 
          title: 'Chat History',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Coach chat history',
        }} 
      />
    </Stack.Navigator>
  );
}