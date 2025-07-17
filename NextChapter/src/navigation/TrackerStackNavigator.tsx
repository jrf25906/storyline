import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TrackerStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

// Screens
import TrackerScreen from '../screens/main/TrackerScreen';
import JobApplicationsScreen from '../screens/tracker/JobApplicationsScreen';

const Stack = createNativeStackNavigator<TrackerStackParamList>();

export default function TrackerStackNavigator() {
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
        name="JobApplications" 
        component={JobApplicationsScreen} 
        options={{ 
          headerShown: false,
          title: 'Job Tracker',
          headerAccessibilityLabel: 'Job applications tracker',
        }} 
      />
      <Stack.Screen 
        name="ApplicationDetails" 
        component={TrackerScreen} // TODO: Create ApplicationDetailsScreen
        options={({ route }) => ({ 
          title: 'Application Details',
          headerBackTitle: 'Back',
          presentation: 'modal',
          headerAccessibilityLabel: 'Job application details',
        })} 
      />
    </Stack.Navigator>
  );
}