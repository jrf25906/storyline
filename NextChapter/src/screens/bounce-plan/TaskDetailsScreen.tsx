import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useAuthStore } from '@stores/authStore';
import { BOUNCE_PLAN_TASKS } from '@constants/bouncePlanTasks';
import { withErrorBoundary } from '@components/common';
import Card from '@components/common/Card';
import { Typography, Spacing, Colors } from '@theme';

type BouncePlanStackParamList = {
  DailyTask: undefined;
  TaskDetails: { taskId: string };
  Progress: undefined;
  Coach: { context?: string };
};

type TaskDetailsScreenNavigationProp = StackNavigationProp<BouncePlanStackParamList, 'TaskDetails'>;
type TaskDetailsScreenRouteProp = RouteProp<BouncePlanStackParamList, 'TaskDetails'>;

interface TaskDetailsScreenProps {
  navigation: TaskDetailsScreenNavigationProp;
  route: TaskDetailsScreenRouteProp;
}

const CATEGORY_COLORS = {
  mindset: '#8B5CF6',
  practical: '#3B82F6',
  network: '#10B981',
  prepare: '#F59E0B',
  action: '#EF4444',
};

const CATEGORY_LABELS = {
  mindset: 'Mindset',
  practical: 'Practical',
  network: 'Network',
  prepare: 'Prepare',
  action: 'Action',
};

export const TaskDetailsScreen: React.FC<TaskDetailsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { completeTask, skipTask, getTaskStatus } = useBouncePlanStore();
  const { taskId } = route.params;
  
  const [notes, setNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);

  const task = BOUNCE_PLAN_TASKS.find(t => t.id === taskId);
  const taskStatus = task ? getTaskStatus(task.id) : undefined;
  const isCompleted = taskStatus?.completed || false;
  const isSkipped = taskStatus?.skipped || false;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Load existing notes if any
    if (taskStatus?.notes) {
      setNotes(taskStatus.notes);
    }
  }, []);

  if (!task) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Task not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCompleteTask = async () => {
    if (!user?.id || isCompleting) return;

    setIsCompleting(true);
    try {
      await completeTask(user.id, task.id, notes);
      navigation.goBack();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkipTask = async () => {
    if (!user?.id) return;

    try {
      await skipTask(user.id, task.id, notes || 'Skipped');
      navigation.goBack();
    } catch (error) {
      console.error('Error skipping task:', error);
    }
  };

  const handleAskCoach = () => {
    navigation.navigate('Coach', { 
      context: `I'm working on Day ${task.day}: ${task.title}. ${task.description}` 
    });
  };

  const categoryColor = CATEGORY_COLORS[task.category];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <View style={styles.headerMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {CATEGORY_LABELS[task.category]}
                  </Text>
                </View>
                <Text style={[styles.dayText, { color: theme.colors.textSecondary }]}>
                  Day {task.day}
                </Text>
              </View>
            </View>

            {/* Task Info Card */}
            <Card variant="elevated" style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
                  {task.title}
                </Text>
                <View style={styles.durationBadge}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.durationText, { color: theme.colors.primary }]}>
                    {task.duration}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
                {task.description}
              </Text>

              {/* Tips Section */}
              {task.tips.length > 0 && (
                <View style={styles.tipsSection}>
                  <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
                    Tips for Success
                  </Text>
                  {task.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <View style={[styles.tipBullet, { backgroundColor: theme.colors.success }]} />
                      <Text style={[styles.tipText, { color: theme.colors.text }]}>
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            {/* Notes Section */}
            {!isCompleted && !isSkipped && (
              <Card variant="outlined" style={styles.notesCard}>
                <Text style={[styles.notesTitle, { color: theme.colors.text }]}>
                  Notes (optional)
                </Text>
                <TextInput
                  style={[styles.notesInput, { 
                    color: theme.colors.text,
                    borderColor: theme.colors.border 
                  }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any thoughts or reflections..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Card>
            )}

            {/* Status Display */}
            {(isCompleted || isSkipped) && (
              <Card 
                variant={isCompleted ? 'progress' : 'outlined'} 
                style={styles.statusCard}
              >
                <View style={styles.statusContent}>
                  <Ionicons 
                    name={isCompleted ? 'checkmark-circle' : 'close-circle'} 
                    size={48} 
                    color={isCompleted ? Colors.white : theme.colors.textSecondary} 
                  />
                  <Text style={[styles.statusText, { 
                    color: isCompleted ? theme.colors.text : theme.colors.textSecondary 
                  }]}>
                    {isCompleted ? 'Task Completed!' : 'Task Skipped'}
                  </Text>
                  {taskStatus?.notes && (
                    <View style={styles.savedNotesContainer}>
                      <Text style={[styles.savedNotesLabel, { color: theme.colors.textSecondary }]}>
                        Your notes:
                      </Text>
                      <Text style={[styles.savedNotes, { color: theme.colors.text }]}>
                        {taskStatus.notes}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            )}

            {/* Action Buttons */}
            {!isCompleted && !isSkipped && (
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleCompleteTask}
                  disabled={isCompleting}
                  accessibilityLabel="Mark task as complete"
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>
                    {isCompleting ? 'Completing...' : 'Mark as Complete'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.secondaryActions}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                    onPress={handleSkipTask}
                    accessibilityLabel="Skip this task"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                      Skip Task
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                    onPress={handleAskCoach}
                    accessibilityLabel="Ask coach for help"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                      Ask Coach
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSizes.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: Typography.fontSizes.caption,
    fontWeight: Typography.fontWeights.semiBold,
  },
  dayText: {
    fontSize: Typography.fontSizes.bodySM,
  },
  taskCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  taskTitle: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.bold,
    flex: 1,
    marginRight: Spacing.md,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
  },
  durationText: {
    fontSize: Typography.fontSizes.caption,
    fontWeight: Typography.fontWeights.medium,
  },
  taskDescription: {
    fontSize: Typography.fontSizes.body,
    lineHeight: Typography.fontSizes.body * 1.6,
    marginBottom: Spacing.lg,
  },
  tipsSection: {
    marginTop: Spacing.md,
  },
  tipsTitle: {
    fontSize: Typography.fontSizes.bodyLG,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.fontSizes.body,
    lineHeight: Typography.fontSizes.body * 1.5,
  },
  notesCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  notesTitle: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: Typography.fontSizes.body,
    minHeight: 100,
  },
  statusCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statusText: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    marginTop: Spacing.sm,
  },
  savedNotesContainer: {
    marginTop: Spacing.lg,
    width: '100%',
  },
  savedNotesLabel: {
    fontSize: Typography.fontSizes.bodySM,
    marginBottom: Spacing.xs,
  },
  savedNotes: {
    fontSize: Typography.fontSizes.body,
    lineHeight: Typography.fontSizes.body * 1.5,
  },
  actionSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.semiBold,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
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

export default withErrorBoundary(TaskDetailsScreen, {
  errorMessage: {
    title: 'Task details unavailable',
    message: "We couldn't load the task details. Please go back and try again."
  }
});