import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { FinancialRunway } from '@types/budget';
import { formatCurrency, formatDate } from '@utils/budget/budgetCalculations';

interface RunwayIndicatorProps {
  runway: FinancialRunway;
}

export const RunwayIndicator: React.FC<RunwayIndicatorProps> = ({ runway }) => {
  const { theme } = useTheme();
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Calculate progress percentage (capped at 365 days for visualization)
  const maxDays = 365;
  const progressPercentage = Math.min((runway.runwayInDays / maxDays) * 100, 100);
  
  // Determine color based on runway length
  const getProgressColor = () => {
    if (runway.runwayInDays === Infinity) return theme.colors.success;
    if (runway.runwayInDays < 30) return theme.colors.error;
    if (runway.runwayInDays < 60) return theme.colors.warning;
    return theme.colors.success;
  };

  useEffect(() => {
    // Animate progress bar on mount
    Animated.timing(animatedWidth, {
      toValue: progressPercentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Announce runway status to screen readers
    const announcement = runway.runwayInDays === Infinity
      ? 'Unlimited financial runway'
      : `Financial runway: ${runway.runwayInMonths} months remaining`;
    
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [progressPercentage, runway.runwayInMonths, runway.runwayInDays]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.h3,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    monthsText: {
      fontSize: theme.typography.sizes.h2,
      fontWeight: theme.typography.weights.bold,
      color: getProgressColor(),
    },
    daysText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textMuted,
      marginLeft: theme.spacing.sm,
    },
    progressBarContainer: {
      height: 24,
      backgroundColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    progressBar: {
      height: '100%',
      backgroundColor: getProgressColor(),
      borderRadius: theme.borderRadius.lg,
    },
    detailsContainer: {
      marginTop: theme.spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    detailLabel: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.textMuted,
    },
    detailValue: {
      fontSize: theme.typography.sizes.bodySmall,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
    },
    projectedEndText: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  });

  return (
    <View 
      style={styles.container}
      accessibilityLabel={`Financial runway indicator showing ${runway.runwayInMonths} months remaining`}
      accessibilityRole="summary"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Financial Runway</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={styles.monthsText}>
            {runway.runwayInDays === Infinity ? 'Unlimited' : `${runway.runwayInMonths} months`}
          </Text>
          {runway.runwayInDays !== Infinity && (
            <Text style={styles.daysText}>({runway.runwayInDays} days)</Text>
          )}
        </View>
      </View>

      <View 
        style={styles.progressBarContainer}
        testID="runway-progress-bar"
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: progressPercentage,
        }}
      >
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
          testID="runway-progress-fill"
        />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total available funds</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(runway.totalAvailableFunds)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly burn</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(runway.monthlyBurn)}
          </Text>
        </View>
      </View>

      {runway.runwayInDays !== Infinity && (
        <Text style={styles.projectedEndText}>
          Funds projected until {formatDate(runway.projectedEndDate)}
        </Text>
      )}
    </View>
  );
};