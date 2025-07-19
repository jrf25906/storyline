import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BouncePlanStackParamList } from '@types/navigation';
import { useTheme } from '@context/ThemeContext';

// Screens
import BouncePlanScreen from '@screens/main/BouncePlanScreen';
import { DailyTaskScreen } from '@screens/bounce-plan';

const Stack = createNativeStackNavigator<BouncePlanStackParamList>();

export default function BouncePlanStackNavigator() {
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
        name="BouncePlanOverview" 
        component={BouncePlanScreen} 
        options={{ 
          headerShown: false,
          title: 'Bounce Plan',
          headerAccessibilityLabel: 'Bounce plan overview',
        }} 
      />
      <Stack.Screen 
        name="DailyTask" 
        component={DailyTaskScreen} 
        options={({ route }) => ({ 
          title: `Day ${route.params.day}`,
          headerBackTitle: 'Back',
          presentation: 'modal',
          headerAccessibilityLabel: `Daily task for day ${route.params.day}`,
        })} 
      />
      <Stack.Screen 
        name="TaskHistory" 
        component={BouncePlanScreen} // TODO: Create TaskHistoryScreen
        options={{ 
          title: 'Task History',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Task history screen',
        }} 
      />
    </Stack.Navigator>
  );
}