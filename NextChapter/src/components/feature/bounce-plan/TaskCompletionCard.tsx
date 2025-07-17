import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../common/Card';
import { useTheme } from '../../../context/ThemeContext';
import { Typography, Spacing, Colors } from '../../../theme';

interface TaskCompletionCardProps {
  taskTitle: string;
  message?: string;
  notes?: string;
  onNextTask: () => void;
  scaleAnimation: Animated.Value;
}

export default function TaskCompletionCard({
  taskTitle,
  message = "Nice work! That was a big one.",
  notes,
  onNextTask,
  scaleAnimation,
}: TaskCompletionCardProps) {
  const { theme } = useTheme();

  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnimation }]
    }}>
      <Card 
        variant="progress" 
        style={styles.completionCard}
        shadow={true}
      >
        <View style={styles.completionContent}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={32} color={Colors.white} />
          </View>
          <Text style={[styles.completionTitle, { color: theme.colors.text }]}>
            {taskTitle}
          </Text>
          <Text style={[styles.completionMessage, { color: theme.colors.text }]}>
            {message}
          </Text>
          {notes && (
            <Text style={[styles.completionNote, { color: theme.colors.textSecondary }]}>
              Your notes are saved in your tools.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.nextTaskButton, { backgroundColor: theme.colors.white }]}
            onPress={onNextTask}
            accessibilityLabel="View tomorrow's task"
            accessibilityRole="button"
          >
            <Text style={[styles.nextTaskButtonText, { color: Colors.successMint }]}>
              View Tomorrow's Task
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  completionCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  completionContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  completionTitle: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: Typography.fontSizes.body,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  completionNote: {
    fontSize: Typography.fontSizes.bodySM,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  nextTaskButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  nextTaskButtonText: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.semiBold,
  },
});