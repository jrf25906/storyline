import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import { useBudgetStore } from '@stores/budgetStore';
import { budgetService } from '@services/budget/budgetService';

interface BudgetData {
  income: {
    salary: number;
    unemployment: number;
    savings: number;
  };
  expenses: {
    rent: number;
    utilities: number;
    groceries: number;
    transportation: number;
    [key: string]: number;
  };
}

const BudgetCalculatorScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { saveBudgetData, calculateRunway } = useBudgetStore();

  const [budgetData, setBudgetData] = useState<BudgetData>({
    income: {
      salary: 0,
      unemployment: 0,
      savings: 0,
    },
    expenses: {
      rent: 0,
      utilities: 0,
      groceries: 0,
      transportation: 0,
    },
  });

  const [customExpenses, setCustomExpenses] = useState<Array<{ name: string; amount: number }>>([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const updateIncome = (field: keyof BudgetData['income'], value: string) => {
    setBudgetData(prev => ({
      ...prev,
      income: {
        ...prev.income,
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const updateExpense = (field: string, value: string) => {
    setBudgetData(prev => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        [field]: parseFloat(value) || 0,
      },
    }));
  };

  const addCustomExpense = () => {
    if (newExpenseName && newExpenseAmount) {
      const amount = parseFloat(newExpenseAmount);
      if (!isNaN(amount)) {
        setCustomExpenses(prev => [...prev, { name: newExpenseName, amount }]);
        setBudgetData(prev => ({
          ...prev,
          expenses: {
            ...prev.expenses,
            [newExpenseName.toLowerCase()]: amount,
          },
        }));
        setNewExpenseName('');
        setNewExpenseAmount('');
      }
    }
  };

  const calculateBudgetRunway = async () => {
    try {
      // Validate budget data
      const validation = budgetService.validateBudgetData(budgetData);
      if (!validation.isValid) {
        Alert.alert(
          'Invalid Budget Data',
          validation.errors.join('\n'),
          [{ text: 'OK' }]
        );
        return;
      }

      // Calculate runway
      const runwayResult = await budgetService.calculateFinancialRunway(budgetData);
      await calculateRunway(budgetData);

      // Show warning for low runway
      if (runwayResult.isLowRunway) {
        Alert.alert(
          'Critical Financial Situation',
          'Your runway is less than 1 month. Immediate action needed.',
          [{ text: 'OK' }]
        );
      }

      // Navigate to overview
      navigation.navigate('BudgetOverview' as never);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to calculate runway',
        [{ text: 'OK' }]
      );
    }
  };

  const saveBudget = async () => {
    try {
      await saveBudgetData({
        ...budgetData,
        totalIncome: Object.values(budgetData.income).reduce((sum, val) => sum + val, 0),
        totalExpenses: Object.values(budgetData.expenses).reduce((sum, val) => sum + val, 0),
      });
      Alert.alert('Success', 'Budget saved successfully!', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save budget data',
        [{ text: 'OK' }]
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSizes.headingMD,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    inputContainer: {
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borders.radius.md,
      padding: theme.spacing.sm,
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    addExpenseContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    addExpenseInput: {
      flex: 1,
      marginRight: theme.spacing.xs,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.sm,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    addButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSizes.body,
      fontWeight: theme.typography.fontWeights.semiBold,
    },
    calculateButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    calculateButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSizes.bodyLG,
      fontWeight: theme.typography.fontWeights.bold,
    },
    saveButton: {
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    saveButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSizes.body,
      fontWeight: theme.typography.fontWeights.semiBold,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {/* Income Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Monthly Salary</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your monthly salary"
              keyboardType="numeric"
              value={budgetData.income.salary.toString()}
              onChangeText={(value) => updateIncome('salary', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Total Savings</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your total savings"
              keyboardType="numeric"
              value={budgetData.income.savings.toString()}
              onChangeText={(value) => updateIncome('savings', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Weekly Unemployment Benefit</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter weekly unemployment benefit"
              keyboardType="numeric"
              value={budgetData.income.unemployment.toString()}
              onChangeText={(value) => updateIncome('unemployment', value)}
            />
          </View>
        </View>

        {/* Expenses Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Expenses</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rent/Mortgage</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter monthly rent/mortgage"
              keyboardType="numeric"
              value={budgetData.expenses.rent.toString()}
              onChangeText={(value) => updateExpense('rent', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Utilities</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter monthly utilities"
              keyboardType="numeric"
              value={budgetData.expenses.utilities.toString()}
              onChangeText={(value) => updateExpense('utilities', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Groceries</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter monthly groceries"
              keyboardType="numeric"
              value={budgetData.expenses.groceries.toString()}
              onChangeText={(value) => updateExpense('groceries', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Transportation</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter monthly transportation"
              keyboardType="numeric"
              value={budgetData.expenses.transportation.toString()}
              onChangeText={(value) => updateExpense('transportation', value)}
            />
          </View>

          {/* Custom Expenses */}
          {customExpenses.map((expense, index) => (
            <View key={index} style={styles.inputContainer}>
              <Text style={styles.label}>{expense.name}</Text>
              <Text style={styles.input}>${expense.amount}</Text>
            </View>
          ))}

          {/* Add Custom Expense */}
          <TouchableOpacity style={styles.addButton} onPress={addCustomExpense}>
            <Text style={styles.addButtonText}>Add Expense</Text>
          </TouchableOpacity>

          <View style={styles.addExpenseContainer}>
            <TextInput
              style={[styles.input, styles.addExpenseInput]}
              placeholder="Enter expense name"
              value={newExpenseName}
              onChangeText={setNewExpenseName}
            />
            <TextInput
              style={[styles.input, styles.addExpenseInput]}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={newExpenseAmount}
              onChangeText={setNewExpenseAmount}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.calculateButton} onPress={calculateBudgetRunway}>
          <Text style={styles.calculateButtonText}>Calculate Runway</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={saveBudget}>
          <Text style={styles.saveButtonText}>Save Budget</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default withErrorBoundary(BudgetCalculatorScreen);