import { StyleSheet } from 'react-native';
import { Theme } from '@theme/types';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizes.h1,
      fontWeight: theme.typography.fontWeights.bold,
    },
    profileCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    profileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    userInfo: {
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    userName: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizes.h3,
      fontWeight: theme.typography.fontWeights.semibold,
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      color: theme.colors.textSecondary,
    },
    menuSection: {
      paddingHorizontal: theme.spacing.lg,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizes.body1,
      fontWeight: theme.typography.fontWeights.medium,
      marginBottom: theme.spacing.xs,
    },
    menuSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSizes.caption,
    },
  });