import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { BudgetAlert } from '../../../types/budget';
import { formatRelativeTime } from '../../../utils/budget/budgetCalculations';

interface BudgetAlertsProps {
  alerts: BudgetAlert[];
  onDismiss: (alertId: string) => void;
}

export const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ alerts, onDismiss }) => {
  const { theme } = useTheme();

  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  if (activeAlerts.length === 0) {
    return null;
  }

  const getAlertColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
      default:
        return theme.colors.success;
    }
  };

  const getAlertIcon = (type: BudgetAlert['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'critical_runway':
        return 'alert-circle';
      case 'low_runway':
        return 'warning';
      case 'benefit_expiring':
        return 'time';
      case 'expense_increase':
      default:
        return 'information-circle';
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.lg,
    },
    header: {
      fontSize: theme.typography.sizes.h3,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    alert: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderLeftWidth: 4,
      ...theme.shadows.sm,
    },
    alertContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    alertIcon: {
      marginRight: theme.spacing.sm,
      marginTop: 2,
    },
    alertTextContainer: {
      flex: 1,
    },
    alertTitle: {
      fontSize: theme.typography.sizes.body,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    alertMessage: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.xs,
    },
    alertTimestamp: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.textMuted,
    },
    dismissButton: {
      padding: theme.spacing.xs,
      marginLeft: theme.spacing.sm,
    },
  });

  return (
    <View style={styles.container} accessibilityLabel="Budget alerts section">
      <Text style={styles.header}>Alerts</Text>
      
      {activeAlerts.map((alert) => {
        const alertColor = getAlertColor(alert.severity);
        const alertIcon = getAlertIcon(alert.type);
        
        return (
          <Animated.View
            key={alert.id}
            style={[
              styles.alert,
              { borderLeftColor: alertColor }
            ]}
            testID={`alert-${alert.severity}`}
          >
            <View style={styles.alertContent}>
              <Ionicons
                name={alertIcon}
                size={24}
                color={alertColor}
                style={styles.alertIcon}
                testID={`alert-icon-${alert.severity}`}
              />
              
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTimestamp}>
                  {formatRelativeTime(alert.createdAt)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => onDismiss(alert.id)}
                testID={`dismiss-alert-${alert.id}`}
                accessibilityLabel="Dismiss alert"
                accessibilityRole="button"
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};