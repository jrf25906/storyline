import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useBudgetStore } from '@stores/budgetStore';
import { useAuthStore } from '@stores/authStore';
import { withErrorBoundary } from '@components/common';
import { 
  H1,
  H2,
  Body,
  BodySM,
  Caption
} from '@components/common/Typography';

type BudgetStackParamList = {
  BudgetOverview: undefined;
  AddExpense: undefined;
  BenefitsCalculator: undefined;
};

type BudgetOverviewScreenNavigationProp = StackNavigationProp<BudgetStackParamList, 'BudgetOverview'>;
type BudgetOverviewScreenRouteProp = RouteProp<BudgetStackParamList, 'BudgetOverview'>;

interface BudgetOverviewScreenProps {
  navigation: BudgetOverviewScreenNavigationProp;
  route: BudgetOverviewScreenRouteProp;
}

export const BudgetOverviewScreen: React.FC<BudgetOverviewScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { 
    budgetData,
    runway,
    unemploymentBenefit,
    alerts,
    isLoading,
    error,
    loadBudget,
    loadBudgetEntries,
    getTotalMonthlyExpenses,
    dismissAlert,
  } = useBudgetStore();

  useEffect(() => {
    // Load budget data when component mounts
    loadBudget();
    if (user?.id) {
      loadBudgetEntries(user.id);
    }
  }, [user?.id]);

  const handleRefresh = async () => {
    await loadBudget();
    if (user?.id) {
      await loadBudgetEntries(user.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getRunwayColor = (months: number) => {
    if (months >= 6) return '#48BB78';
    if (months >= 3) return '#D69E2E';
    return '#E53E3E';
  };

  if (isLoading && !budgetData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3182CE" />
          <Body style={styles.loadingText}>Loading your financial data...</Body>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !budgetData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Body style={styles.errorText}>{error}</Body>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Body style={styles.retryButtonText}>Retry</Body>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }>
        <View style={styles.header}>
          <H1 style={styles.headerTitle}>Financial Runway</H1>
          <Body style={styles.headerSubtitle}>
            Plan your finances during your transition
          </Body>
        </View>

        {/* Alerts Section */}
        {alerts.filter(a => !a.dismissed).map(alert => (
          <View key={alert.id} style={[styles.alertCard, styles[`${alert.severity}Alert`]]}>
            <View style={styles.alertContent}>
              <Body style={styles.alertTitle}>{alert.title}</Body>
              <BodySM style={styles.alertMessage}>{alert.message}</BodySM>
            </View>
            <TouchableOpacity 
              onPress={() => dismissAlert(alert.id)}
              style={styles.dismissButton}
              accessibilityLabel="Dismiss alert"
            >
              <Body style={styles.dismissButtonText}>✕</Body>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.runwayCard}>
          <Body style={styles.runwayLabel}>Your runway</Body>
          <H1 
            style={[styles.runwayMonths, { color: getRunwayColor(runway?.runwayInMonths || 0) }]}
          >
            {runway ? `${runway.runwayInMonths.toFixed(1)} months` : '-- months'}
          </H1>
          <BodySM style={styles.runwayDescription}>
            {runway 
              ? `${runway.runwayInDays} days remaining`
              : 'Set up your budget to calculate runway'}
          </BodySM>
          {runway && runway.isLowRunway && (
            <View style={styles.warningBox}>
              <BodySM style={styles.warningText}>
                ⚠️ Your runway is below 2 months. Consider reducing expenses or exploring additional income sources.
              </BodySM>
            </View>
          )}
        </View>

        <View style={styles.summarySection}>
          <H2 style={styles.sectionTitle}>Financial Summary</H2>
          
          <View style={styles.summaryItem}>
            <Body style={styles.summaryLabel}>Total Savings</Body>
            <TextInput
              style={styles.summaryValue}
              value={formatCurrency(budgetData?.currentSavings || 0)}
              editable={false}
              accessibilityLabel={`Total savings: ${formatCurrency(budgetData?.currentSavings || 0)}`}
            />
          </View>

          <View style={styles.summaryItem}>
            <Body style={styles.summaryLabel}>Monthly Expenses</Body>
            <TextInput
              style={styles.summaryValue}
              value={formatCurrency(getTotalMonthlyExpenses())}
              editable={false}
              accessibilityLabel={`Monthly expenses: ${formatCurrency(getTotalMonthlyExpenses())}`}
            />
          </View>

          <View style={styles.summaryItem}>
            <Body style={styles.summaryLabel}>Weekly Unemployment Benefits</Body>
            <TextInput
              style={styles.summaryValue}
              value={formatCurrency(unemploymentBenefit?.weeklyAmount || 0)}
              editable={false}
              accessibilityLabel={`Weekly unemployment benefits: ${formatCurrency(unemploymentBenefit?.weeklyAmount || 0)}`}
            />
          </View>

          {budgetData?.severanceAmount ? (
            <View style={styles.summaryItem}>
              <Body style={styles.summaryLabel}>Severance Package</Body>
              <TextInput
                style={styles.summaryValue}
                value={formatCurrency(budgetData.severanceAmount)}
                editable={false}
                accessibilityLabel={`Severance package: ${formatCurrency(budgetData.severanceAmount)}`}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ExpenseTracker')}
            accessibilityLabel="Track expenses"
            accessibilityRole="button"
          >
            <Body style={styles.actionButtonText}>Track Expenses</Body>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('BudgetCalculator')}
            accessibilityLabel="Calculate benefits"
            accessibilityRole="button"
          >
            <Body style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Calculate Benefits
            </Body>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsSection}>
          <H2 style={styles.sectionTitle}>Budget Tips</H2>
          <View style={styles.tipCard}>
            <Body style={styles.tipTitle}>💡 Review subscriptions</Body>
            <BodySM style={styles.tipText}>
              Cancel or pause non-essential subscriptions to extend your runway
            </BodySM>
          </View>
          <View style={styles.tipCard}>
            <Body style={styles.tipTitle}>📊 Track daily expenses</Body>
            <BodySM style={styles.tipText}>
              Small daily expenses add up. Track everything for a week to identify savings
            </BodySM>
          </View>
          <View style={styles.tipCard}>
            <Body style={styles.tipTitle}>🏥 COBRA alternatives</Body>
            <BodySM style={styles.tipText}>
              Research healthcare marketplace options - they may be more affordable than COBRA
            </BodySM>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
  },
  runwayCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginVertical: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  runwayLabel: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 8,
  },
  runwayMonths: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  runwayDescription: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    color: '#C53030',
    fontSize: 14,
    textAlign: 'center',
  },
  summarySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#4A5568',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'right',
  },
  actionButtons: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#3182CE',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 48,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3182CE',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3182CE',
  },
  tipsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alertCard: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningAlert: {
    backgroundColor: '#FFFAF0',
    borderColor: '#F6AD55',
  },
  criticalAlert: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FC8181',
  },
  infoAlert: {
    backgroundColor: '#E6FFFA',
    borderColor: '#4FD1C5',
  },
  alertContent: {
    flex: 1,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonText: {
    fontSize: 18,
    color: '#718096',
  },
});

export default withErrorBoundary(BudgetOverviewScreen, {
  errorMessage: {
    title: 'Budget overview temporarily unavailable',
    message: 'Your financial data is safe. Please refresh to try again.'
  }
});