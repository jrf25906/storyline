import { StyleSheet } from 'react-native';
import { Theme } from '@/styles/theme';

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
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    },
    greeting: {
      fontSize: theme.typography.sizes.h2,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    date: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textMuted,
    },
    
    // Bounce Plan Section
    bouncePlanContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bouncePlanLeft: {
      flex: 1,
    },
    dayProgress: {
      fontSize: theme.typography.sizes.h3,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    taskPreview: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    taskStatus: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.textMuted,
    },
    progressCircle: {
      width: 80,
      height: 80,
      marginLeft: theme.spacing.md,
    },
    
    // Budget Section
    budgetContent: {
      alignItems: 'center',
    },
    runwayAmount: {
      fontSize: theme.typography.sizes.h1,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    runwayLabel: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.md,
    },
    runwayBar: {
      width: '100%',
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
    },
    runwayProgress: {
      height: '100%',
      borderRadius: theme.borderRadius.full,
    },
    alertText: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.warning,
    },
    
    // Mood Section
    moodContent: {
      alignItems: 'center',
    },
    moodPrompt: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    moodSelector: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      paddingHorizontal: theme.spacing.lg,
    },
    moodOption: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
    },
    moodEmoji: {
      fontSize: 28,
    },
    moodCheckedIn: {
      alignItems: 'center',
    },
    currentMoodEmoji: {
      fontSize: 48,
      marginBottom: theme.spacing.sm,
    },
    moodStreak: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.success,
      fontWeight: theme.typography.weights.medium,
    },
    
    // Job Tracker Section
    jobStats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
    },
    jobStat: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    jobStatDot: {
      width: 8,
      height: 8,
      borderRadius: theme.borderRadius.full,
      marginRight: theme.spacing.xs,
    },
    jobStatText: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.text,
    },
    totalApplications: {
      fontSize: theme.typography.sizes.h3,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    
    // Quick Actions
    quickActionsSection: {
      marginTop: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.h4,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    coachButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      minHeight: 64, // Large touch target
      ...theme.shadows.lg,
    },
    coachButtonText: {
      fontSize: theme.typography.sizes.button,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.white,
    },
    coachButtonSubtext: {
      fontSize: theme.typography.sizes.bodySmall,
      color: theme.colors.white,
      opacity: 0.8,
      marginTop: theme.spacing.xs,
    },
    
    // Empty States
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    emptyStateText: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    emptyStateButton: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
    },
    emptyStateButtonText: {
      fontSize: theme.typography.sizes.bodySmall,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.white,
    },
  });