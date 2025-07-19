import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useMoodStore } from '@stores/moodStore';

interface TaskDetailScreenProps {
  route: {
    params: {
      taskId: string;
    };
  };
}

const TaskDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params as { taskId: string };
  
  const { getTaskById, completeTask, skipTask } = useBouncePlanStore();
  const { addEntry } = useMoodStore();
  
  const [task, setTask] = useState(getTaskById(taskId));
  const [notes, setNotes] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const taskData = getTaskById(taskId);
    setTask(taskData);
  }, [taskId, getTaskById]);

  const handleStartTask = () => {
    setIsStarted(true);
  };

  const handleCompleteTask = async () => {
    if (!task) return;

    try {
      setIsCompleting(true);
      
      const result = await completeTask(task.id, {
        notes: notes.trim() || undefined,
        completedAt: new Date().toISOString(),
      });

      if (result.success) {
        // Add mood entry for task completion
        await addEntry({
          rating: 4, // Positive rating for task completion
          notes: `Completed task: ${task.title}`,
          timestamp: new Date().toISOString(),
        });

        Alert.alert(
          'Great Job!',
          `You've completed "${task.title}". Keep up the momentum!`,
          [
            {
              text: 'Continue',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to complete task. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkipTask = () => {
    if (!task) return;

    Alert.alert(
      'Skip Task',
      `Are you sure you want to skip "${task.title}"? You can always come back to it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            try {
              await skipTask(task.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to skip task');
            }
          },
        },
      ]
    );
  };

  if (!task) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Task not found</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    header: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.fontSizes.headingLG,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    description: {
      fontSize: theme.typography.fontSizes.bodyLG,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: theme.spacing.lg,
    },
    instructionsContainer: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      marginBottom: theme.spacing.lg,
    },
    instructionsTitle: {
      fontSize: theme.typography.fontSizes.headingMD,
      fontWeight: theme.typography.fontWeights.semiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    instructions: {
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.text,
      lineHeight: 22,
    },
    notesContainer: {
      marginBottom: theme.spacing.lg,
    },
    notesLabel: {
      fontSize: theme.typography.fontSizes.body,
      fontWeight: theme.typography.fontWeights.semiBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    notesInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borders.radius.md,
      padding: theme.spacing.sm,
      fontSize: theme.typography.fontSizes.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    buttonContainer: {
      gap: theme.spacing.sm,
    },
    startButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    startButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSizes.bodyLG,
      fontWeight: theme.typography.fontWeights.bold,
    },
    completeButton: {
      backgroundColor: theme.colors.success,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    completeButtonText: {
      color: theme.colors.white,
      fontSize: theme.typography.fontSizes.bodyLG,
      fontWeight: theme.typography.fontWeights.bold,
    },
    skipButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
      borderRadius: theme.borders.radius.md,
      alignItems: 'center',
    },
    skipButtonText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSizes.body,
      fontWeight: theme.typography.fontWeights.semiBold,
    },
    disabledButton: {
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.subtitle}>
            Day {task.day} • {task.category} • {task.estimatedDuration} min
          </Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        {/* Instructions (shown after starting) */}
        {isStarted && task.instructions && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Instructions</Text>
            <Text style={styles.instructions}>{task.instructions}</Text>
          </View>
        )}

        {/* Notes Section (shown after starting) */}
        {isStarted && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about your experience..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!isStarted ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStartTask}>
              <Text style={styles.startButtonText}>Start Task</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.completeButton, isCompleting && styles.disabledButton]} 
              onPress={handleCompleteTask}
              disabled={isCompleting}
            >
              <Text style={styles.completeButtonText}>
                {isCompleting ? 'Completing...' : 'Complete Task'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.skipButton} onPress={handleSkipTask}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default withErrorBoundary(TaskDetailScreen);