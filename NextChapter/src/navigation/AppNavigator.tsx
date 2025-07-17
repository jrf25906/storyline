import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import { LoadingOverlay } from '../components/common/LoadingOverlay';

// Navigators
import AuthStackNavigator from './AuthStackNavigator';
import MainTabNavigator from './MainTabNavigator';

// Modal Screens
import ResumeScannerScreen from '../screens/resume/ResumeScannerScreen';
import { View } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate initialization (in real app, this might be checking stored auth, etc.)
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isInitializing || isLoading) {
    return <LoadingOverlay visible={true} message="Loading..." fullScreen={true} />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.colors.background === '#121212',
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
        fonts: {
          regular: {
            fontFamily: theme.typography?.fontFamily?.regular || 'System',
            fontWeight: 'normal' as const,
          },
          medium: {
            fontFamily: theme.typography?.fontFamily?.medium || 'System',
            fontWeight: '500' as const,
          },
          bold: {
            fontFamily: theme.typography?.fontFamily?.bold || 'System',
            fontWeight: 'bold' as const,
          },
          heavy: {
            fontFamily: theme.typography?.fontFamily?.bold || 'System',
            fontWeight: '700' as const,
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthStackNavigator}
            options={{
              animationTypeForReplace: !user ? 'pop' : 'push',
            }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
            />
            {/* Modal Screens */}
            <Stack.Group
              screenOptions={{
                presentation: 'modal',
                headerShown: true,
                headerStyle: {
                  backgroundColor: theme.colors.surface,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                  fontSize: theme.typography.sizes.h3,
                  fontWeight: theme.typography.weights.semibold,
                },
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen 
                name="AddJobApplication" 
                component={View} // TODO: Create AddJobApplicationScreen
                options={{ 
                  title: 'Add Application',
                  headerAccessibilityLabel: 'Add job application screen',
                }} 
              />
              <Stack.Screen 
                name="EditJobApplication" 
                component={View} // TODO: Create EditJobApplicationScreen
                options={{ 
                  title: 'Edit Application',
                  headerAccessibilityLabel: 'Edit job application screen',
                }} 
              />
              <Stack.Screen 
                name="ResumeScanner" 
                component={ResumeScannerScreen}
                options={{ 
                  title: 'Resume Scanner',
                  headerAccessibilityLabel: 'Resume scanner screen',
                }} 
              />
              <Stack.Screen 
                name="BudgetDetails" 
                component={View} // TODO: Create BudgetDetailsScreen
                options={{ 
                  title: 'Budget Details',
                  headerAccessibilityLabel: 'Budget details screen',
                }} 
              />
              <Stack.Screen 
                name="CoachSettings" 
                component={View} // TODO: Create CoachSettingsScreen
                options={{ 
                  title: 'Coach Settings',
                  headerAccessibilityLabel: 'Coach settings screen',
                }} 
              />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}