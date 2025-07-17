import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useBudgetStore } from '../../stores/budgetStore';
import { RunwayIndicator, BudgetForm, BudgetAlerts } from '../../components/feature/budget';
import { formatCurrency } from '../../utils/budget/budgetCalculations';
import { Ionicons } from '@expo/vector-icons';
import { withErrorBoundary, Container } from '../../components/common';
import { 
  H1,
  H2,
  H3,
  Body,
  BodySM,
  Caption
} from '../../components/common/Typography';

function BudgetScreen() {
  const { theme } = useTheme();
  const {
    budgetData,
    runway,
    alerts,
    isLoading,
    error,
    updateBudget,
    loadBudgetData,
    dismissAlert,
  } = useBudgetStore();

  const [isEditing, setIsEditing] = useState(!budgetData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBudgetData();
    setIsRefreshing(false);
  };

  const handleFormSubmit = async (formData: any) => {
    await updateBudget(formData, true);
    setIsEditing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingTop: 60,
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: theme.typography.sizes.h1,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.white,
    },
    headerSubtitle: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.white,
      opacity: 0.9,
      marginTop: theme.spacing.xs,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    editButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.sizes.bodySmall,
      fontWeight: theme.typography.weights.medium,
      marginLeft: theme.spacing.xs,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.sizes.button,
      fontWeight: theme.typography.weights.semibold,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.h3,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    breakdownCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    breakdownSection: {
      marginBottom: theme.spacing.lg,
    },
    breakdownHeader: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    breakdownLabel: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textMuted,
    },
    breakdownValue: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.md,
      marginTop: theme.spacing.sm,
      borderTopWidth: 2,
      borderTopColor: theme.colors.border,
    },
    totalLabel: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    totalValue: {
      fontSize: theme.typography.sizes.h3,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.primary,
    },
    tipsSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      ...theme.shadows.sm,
    },
    tipItem: {
      flexDirection: 'row',
      marginBottom: theme.spacing.md,
    },
    tipIcon: {
      marginRight: theme.spacing.sm,
      marginTop: 2,
    },
    tipText: {
      flex: 1,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      lineHeight: 22,
    },
  });

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer} testID="loading-indicator">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Body style={styles.errorText}>{error}</Body>
        <TouchableOpacity style={styles.retryButton} onPress={loadBudgetData}>
          <Body style={styles.retryButtonText}>Try Again</Body>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="Budget Calculator Screen">
      <View style={styles.header}>
        <View>
          <H1 style={styles.headerTitle}>Budget Calculator</H1>
          <Body style={styles.headerSubtitle}>Financial Planning</Body>
        </View>
        {budgetData && !isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={16} color={theme.colors.white} />
            <BodySM style={styles.editButtonText}>Edit Budget</BodySM>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Alerts */}
        <BudgetAlerts alerts={alerts} onDismiss={dismissAlert} />

        {isEditing || !budgetData ? (
          <BudgetForm
            initialData={budgetData ? {
              monthlyIncome: budgetData.monthlyIncome,
              currentSavings: budgetData.currentSavings,
              monthlyExpenses: budgetData.monthlyExpenses,
              severanceAmount: budgetData.severanceAmount,
              state: budgetData.state,
              hasHealthInsurance: budgetData.cobraCost > 0,
              dependentsCount: 0, // This would need to be stored in budget data
            } : undefined}
            onSubmit={handleFormSubmit}
            submitButtonText={budgetData ? 'Update Budget' : 'Calculate Runway'}
          />
        ) : (
          <>
            {/* Runway Indicator */}
            {runway && (
              <View testID="runway-indicator">
                <RunwayIndicator runway={runway} />
              </View>
            )}

            {/* Financial Breakdown */}
            <View style={styles.section}>
              <H2 style={styles.sectionTitle}>Financial Breakdown</H2>
              <View style={styles.breakdownCard}>
                {/* Available Funds */}
                <View style={styles.breakdownSection}>
                  <Body style={styles.breakdownHeader}>Available Funds</Body>
                  <View style={styles.breakdownRow}>
                    <Body style={styles.breakdownLabel}>Current Savings</Body>
                    <Body style={styles.breakdownValue}>
                      {formatCurrency(budgetData.currentSavings)}
                    </Body>
                  </View>
                  {budgetData.severanceAmount > 0 && (
                    <View style={styles.breakdownRow}>
                      <Body style={styles.breakdownLabel}>Severance</Body>
                      <Body style={styles.breakdownValue}>
                        {formatCurrency(budgetData.severanceAmount)}
                      </Body>
                    </View>
                  )}
                  {budgetData.unemploymentBenefit > 0 && (
                    <View style={styles.breakdownRow}>
                      <Body style={styles.breakdownLabel}>Unemployment Benefits</Body>
                      <Body style={styles.breakdownValue}>
                        {formatCurrency(budgetData.unemploymentBenefit * budgetData.unemploymentWeeks)}
                      </Body>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Body style={styles.totalLabel}>Total Available</Body>
                    <H3 style={styles.totalValue}>
                      {formatCurrency(runway?.totalAvailableFunds || 0)}
                    </H3>
                  </View>
                </View>

                {/* Monthly Expenses */}
                <View style={styles.breakdownSection}>
                  <Body style={styles.breakdownHeader}>Monthly Expenses</Body>
                  <View style={styles.breakdownRow}>
                    <Body style={styles.breakdownLabel}>Living Expenses</Body>
                    <Body style={styles.breakdownValue}>
                      {formatCurrency(budgetData.monthlyExpenses)}
                    </Body>
                  </View>
                  {budgetData.cobraCost > 0 && (
                    <View style={styles.breakdownRow}>
                      <Body style={styles.breakdownLabel}>COBRA Insurance</Body>
                      <Body style={styles.breakdownValue}>
                        {formatCurrency(budgetData.cobraCost)}
                      </Body>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Body style={styles.totalLabel}>Total Monthly</Body>
                    <H3 style={[styles.totalValue, { color: '#D4736A' }]}>
                      {formatCurrency(runway?.monthlyBurn || 0)}
                    </H3>
                  </View>
                </View>
              </View>
            </View>

            {/* Budget Tips */}
            <View style={styles.section}>
              <H2 style={styles.sectionTitle}>Budget Tips</H2>
              <View style={styles.tipsSection}>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.success}
                    style={styles.tipIcon}
                  />
                  <Body style={styles.tipText}>
                    Review your expenses monthly and look for areas to reduce spending
                  </Body>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.success}
                    style={styles.tipIcon}
                  />
                  <Body style={styles.tipText}>
                    Apply for unemployment benefits immediately if you haven't already
                  </Body>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.success}
                    style={styles.tipIcon}
                  />
                  <Body style={styles.tipText}>
                    Consider COBRA alternatives like marketplace insurance if eligible
                  </Body>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.success}
                    style={styles.tipIcon}
                  />
                  <Body style={styles.tipText}>
                    Build an emergency fund goal of 6-12 months of expenses
                  </Body>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default withErrorBoundary(BudgetScreen, {
  errorMessage: {
    title: 'Budget calculator needs a moment',
    message: "We're working on loading your financial data. Please try again."
  }
});