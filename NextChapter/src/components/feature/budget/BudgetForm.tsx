import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@context/ThemeContext';
import { BudgetFormData, STATE_UNEMPLOYMENT_RATES } from '@types/budget';
import { formatCurrency, parseCurrency } from '@utils/budget/budgetCalculations';
import { Ionicons } from '@expo/vector-icons';

interface BudgetFormProps {
  initialData?: BudgetFormData;
  onSubmit: (data: BudgetFormData) => Promise<void>;
  onChange?: (data: BudgetFormData) => void;
  submitButtonText?: string;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  initialData,
  onSubmit,
  onChange,
  submitButtonText = 'Calculate Runway',
}) => {
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<BudgetFormData>({
    monthlyIncome: initialData?.monthlyIncome || 0,
    currentSavings: initialData?.currentSavings || 0,
    monthlyExpenses: initialData?.monthlyExpenses || 0,
    severanceAmount: initialData?.severanceAmount || 0,
    state: initialData?.state || '',
    hasHealthInsurance: initialData?.hasHealthInsurance || false,
    dependentsCount: initialData?.dependentsCount || 0,
  });

  // Currency input states for display
  const [incomeDisplay, setIncomeDisplay] = useState(
    initialData?.monthlyIncome ? formatCurrency(initialData.monthlyIncome) : ''
  );
  const [savingsDisplay, setSavingsDisplay] = useState(
    initialData?.currentSavings ? formatCurrency(initialData.currentSavings) : ''
  );
  const [expensesDisplay, setExpensesDisplay] = useState(
    initialData?.monthlyExpenses ? formatCurrency(initialData.monthlyExpenses) : ''
  );
  const [severanceDisplay, setSeveranceDisplay] = useState(
    initialData?.severanceAmount ? formatCurrency(initialData.severanceAmount) : ''
  );

  useEffect(() => {
    onChange?.(formData);
  }, [formData, onChange]);

  const handleCurrencyChange = (
    value: string,
    field: keyof BudgetFormData,
    setDisplay: (value: string) => void
  ) => {
    const numericValue = parseCurrency(value);
    setDisplay(value);
    setFormData({ ...formData, [field]: numericValue });
  };

  const handleCurrencyBlur = (
    field: keyof BudgetFormData,
    setDisplay: (value: string) => void
  ) => {
    const value = formData[field] as number;
    if (value > 0) {
      setDisplay(formatCurrency(value));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.state) {
      Alert.alert('Missing Information', 'Please select your state.');
      return false;
    }

    if (formData.monthlyExpenses <= 0) {
      Alert.alert('Missing Information', 'Please enter your monthly expenses.');
      return false;
    }

    if (isNaN(formData.monthlyIncome) || isNaN(formData.currentSavings) ||
        isNaN(formData.monthlyExpenses) || isNaN(formData.severanceAmount)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for all financial fields.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    helperText: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.sm,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
    },
    picker: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    stepperControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepperButton: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: theme.spacing.sm,
    },
    stepperValue: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      minWidth: 30,
      textAlign: 'center',
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.sizes.button,
      fontWeight: theme.typography.weights.semibold,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID="budget-form"
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly Income */}
        <View style={styles.section}>
          <Text style={styles.label}>Monthly Income (pre-layoff)</Text>
          <Text style={styles.helperText}>Your salary before being laid off</Text>
          <TextInput
            style={styles.input}
            value={incomeDisplay}
            onChangeText={(value) => handleCurrencyChange(value, 'monthlyIncome', setIncomeDisplay)}
            onBlur={() => handleCurrencyBlur('monthlyIncome', setIncomeDisplay)}
            placeholder="Enter amount"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            testID="monthly-income-input"
            accessibilityLabel="Monthly income before layoff"
          />
        </View>

        {/* Current Savings */}
        <View style={styles.section}>
          <Text style={styles.label}>Current Savings</Text>
          <Text style={styles.helperText}>Total amount in savings, checking, etc.</Text>
          <TextInput
            style={styles.input}
            value={savingsDisplay}
            onChangeText={(value) => handleCurrencyChange(value, 'currentSavings', setSavingsDisplay)}
            onBlur={() => handleCurrencyBlur('currentSavings', setSavingsDisplay)}
            placeholder="Enter amount"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            testID="current-savings-input"
            accessibilityLabel="Current total savings"
          />
        </View>

        {/* Monthly Expenses */}
        <View style={styles.section}>
          <Text style={styles.label}>Monthly Expenses</Text>
          <Text style={styles.helperText}>Rent, utilities, food, etc.</Text>
          <TextInput
            style={styles.input}
            value={expensesDisplay}
            onChangeText={(value) => handleCurrencyChange(value, 'monthlyExpenses', setExpensesDisplay)}
            onBlur={() => handleCurrencyBlur('monthlyExpenses', setExpensesDisplay)}
            placeholder="Enter amount"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            testID="monthly-expenses-input"
            accessibilityLabel="Monthly expenses"
          />
        </View>

        {/* Severance Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Severance Amount</Text>
          <Text style={styles.helperText}>If applicable</Text>
          <TextInput
            style={styles.input}
            value={severanceDisplay}
            onChangeText={(value) => handleCurrencyChange(value, 'severanceAmount', setSeveranceDisplay)}
            onBlur={() => handleCurrencyBlur('severanceAmount', setSeveranceDisplay)}
            placeholder="Enter amount"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="numeric"
            testID="severance-amount-input"
            accessibilityLabel="Severance amount received"
          />
        </View>

        {/* State Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>State</Text>
          <Text style={styles.helperText}>For unemployment benefit calculation</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={formData.state}
              onValueChange={(value) => setFormData({ ...formData, state: value })}
              testID="state-picker"
              accessibilityLabel="Select your state"
            >
              <Picker.Item label="Select a state" value="" />
              {Object.keys(STATE_UNEMPLOYMENT_RATES).map((state) => (
                <Picker.Item key={state} label={state} value={state} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Health Insurance */}
        <View style={styles.switchContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Had employer health insurance?</Text>
            <Text style={styles.helperText}>For COBRA cost estimation</Text>
          </View>
          <Switch
            value={formData.hasHealthInsurance}
            onValueChange={(value) => setFormData({ ...formData, hasHealthInsurance: value })}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.white}
            testID="health-insurance-switch"
            accessibilityLabel="Had employer health insurance"
          />
        </View>

        {/* Dependents */}
        <View style={styles.stepperContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Number of dependents</Text>
            <Text style={styles.helperText}>For insurance cost calculation</Text>
          </View>
          <View style={styles.stepperControls}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setFormData({ 
                ...formData, 
                dependentsCount: Math.max(0, formData.dependentsCount - 1) 
              })}
              testID="dependents-decrease"
              accessibilityLabel="Decrease dependents count"
            >
              <Ionicons name="remove" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.stepperValue} testID="dependents-value">
              {formData.dependentsCount}
            </Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setFormData({ 
                ...formData, 
                dependentsCount: formData.dependentsCount + 1 
              })}
              testID="dependents-increase"
              accessibilityLabel="Increase dependents count"
            >
              <Ionicons name="add" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          testID="submit-button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>{submitButtonText}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};