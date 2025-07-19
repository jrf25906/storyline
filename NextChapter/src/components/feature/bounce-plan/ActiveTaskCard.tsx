import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@components/common/Card';
import { useTheme } from '@context/ThemeContext';
import { Typography, Spacing, Colors } from '@theme';
import { BouncePlanTaskDefinition } from '@constants/bouncePlanTasks';

interface ActiveTaskCardProps {
  task: BouncePlanTaskDefinition;
  onStartTask: () => void;
  onSkipTask: () => void;
  onAskCoach: () => void;
}

export default function ActiveTaskCard({
  task,
  onStartTask,
  onSkipTask,
  onAskCoach,
}: ActiveTaskCardProps) {
  const { theme } = useTheme();

  return (
    <Card 
      variant="task" 
      style={styles.taskCard}
      shadow={true}
      hoverable={true}
      animatePress={true}
    >
      {/* Task Header */}
      <View style={styles.taskHeader}>
        <View style={styles.taskMeta}>
          <View style={[styles.durationBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.durationText, { color: theme.colors.primary }]}>
              {task.duration}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={onSkipTask}
          style={styles.skipButton}
          accessibilityLabel="Skip this task"
        >
          <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task Content */}
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
          {task.title}
        </Text>
        <Text style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
          {task.description}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={onStartTask}
          accessibilityLabel="Start task"
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Start Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={onAskCoach}
          accessibilityLabel="Ask coach for help"
          accessibilityRole="button"
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
            Ask Coach
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  durationText: {
    fontSize: Typography.fontSizes.caption,
    fontWeight: Typography.fontWeights.medium,
  },
  skipButton: {
    padding: Spacing.xs,
  },
  skipText: {
    fontSize: Typography.fontSizes.bodySM,
  },
  taskContent: {
    marginBottom: Spacing.lg,
  },
  taskTitle: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.sm,
    lineHeight: Typography.fontSizes.headingMD * 1.3,
  },
  taskDescription: {
    fontSize: Typography.fontSizes.body,
    lineHeight: Typography.fontSizes.body * 1.5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.semiBold,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
  },
});