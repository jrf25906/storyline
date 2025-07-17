import { StyleSheet } from 'react-native';
import { Theme } from '../../../styles/theme';

export const createBudgetStyles = (theme: Theme) => StyleSheet.create({
  // Common styles for budget components
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },

  sectionHeader: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },

  label: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textMuted,
  },

  value: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },

  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },

  // Alert styles
  alertContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
  },

  alertSuccess: {
    backgroundColor: `${theme.colors.success}10`,
    borderLeftColor: theme.colors.success,
  },

  alertWarning: {
    backgroundColor: `${theme.colors.warning}10`,
    borderLeftColor: theme.colors.warning,
  },

  alertError: {
    backgroundColor: `${theme.colors.error}10`,
    borderLeftColor: theme.colors.error,
  },

  // Form styles
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },

  inputLabel: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
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

  inputFocused: {
    borderColor: theme.colors.primary,
  },

  // Button styles
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.button,
    fontWeight: theme.typography.weights.semibold,
  },

  // Progress indicator styles
  progressContainer: {
    height: 24,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    borderRadius: theme.borderRadius.lg,
  },

  // Touch target minimum size for accessibility
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});