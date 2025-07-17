import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BudgetStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';

// Screens
import BudgetScreen from '../screens/main/BudgetScreen';
import BudgetOverviewScreen from '../screens/budget/BudgetOverviewScreen';

const Stack = createNativeStackNavigator<BudgetStackParamList>();

export default function BudgetStackNavigator() {
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
        name="BudgetOverview" 
        component={BudgetOverviewScreen} 
        options={{ 
          headerShown: false,
          title: 'Budget Tracker',
          headerAccessibilityLabel: 'Budget overview screen',
        }} 
      />
      <Stack.Screen 
        name="BudgetCalculator" 
        component={BudgetScreen} // TODO: Create BudgetCalculatorScreen
        options={{ 
          title: 'Runway Calculator',
          headerBackTitle: 'Back',
          presentation: 'modal',
          headerAccessibilityLabel: 'Budget runway calculator',
        }} 
      />
      <Stack.Screen 
        name="ExpenseTracker" 
        component={BudgetScreen} // TODO: Create ExpenseTrackerScreen
        options={{ 
          title: 'Track Expenses',
          headerBackTitle: 'Back',
          headerAccessibilityLabel: 'Expense tracker screen',
        }} 
      />
    </Stack.Navigator>
  );
}