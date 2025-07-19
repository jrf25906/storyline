import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Typography, Spacing } from '@theme';
import { BOUNCE_PLAN_TASKS } from '@constants/bouncePlanTasks';

interface WeeklyProgressDotsProps {
  currentDay: number;
  getTaskStatus: (taskId: string) => { completed?: boolean; skipped?: boolean } | undefined;
}

export default function WeeklyProgressDots({ currentDay, getTaskStatus }: WeeklyProgressDotsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.progressSection}>
      <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
        Your Progress This Week
      </Text>
      <View style={styles.progressDots}>
        {[...Array(7)].map((_, index) => {
          const dayNumber = Math.floor((currentDay - 1) / 7) * 7 + index + 1;
          const task = BOUNCE_PLAN_TASKS.find(t => t.day === dayNumber);
          const status = task ? getTaskStatus(task.id) : undefined;
          const isCompleted = status?.completed || false;
          const isToday = dayNumber === currentDay;
          const isFuture = dayNumber > currentDay;
          
          return (
            <View 
              key={index} 
              style={[
                styles.progressDot,
                {
                  backgroundColor: isCompleted 
                    ? theme.colors.success 
                    : isToday 
                      ? theme.colors.primary 
                      : theme.colors.border,
                  opacity: isFuture ? 0.3 : 1,
                }
              ]}
              accessibilityLabel={`Day ${dayNumber}: ${isCompleted ? 'completed' : isToday ? 'today' : isFuture ? 'upcoming' : 'not completed'}`}
            />
          );
        })}
      </View>
      <View style={styles.progressStats}>
        <Text style={[styles.progressStatsText, { color: theme.colors.textSecondary }]}>
          {`${[...Array(7)].filter((_, i) => {
            const day = Math.floor((currentDay - 1) / 7) * 7 + i + 1;
            const task = BOUNCE_PLAN_TASKS.find(t => t.day === day);
            const status = task ? getTaskStatus(task.id) : undefined;
            return status?.completed;
          }).length} of 7 tasks completed this week`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  progressTitle: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
    marginBottom: Spacing.md,
  },
  progressDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressStats: {
    marginTop: Spacing.xs,
  },
  progressStatsText: {
    fontSize: Typography.fontSizes.caption,
  },
});