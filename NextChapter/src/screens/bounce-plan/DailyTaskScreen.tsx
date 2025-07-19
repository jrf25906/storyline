import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useUserStore } from '@stores/userStore';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useAuthStore } from '@stores/authStore';
import { BOUNCE_PLAN_TASKS, BouncePlanTaskDefinition } from '@constants/bouncePlanTasks';
import ActiveTaskCard from '@components/feature/bounce-plan/ActiveTaskCard';
import { withErrorBoundary } from '@components/common';
import TaskCompletionCard from '@components/feature/bounce-plan/TaskCompletionCard';
import WeeklyProgressDots from '@components/feature/bounce-plan/WeeklyProgressDots';
import WeekendCard from '@components/feature/bounce-plan/WeekendCard';
import { Typography, Spacing, Colors } from '@theme';

type BouncePlanStackParamList = {
  DailyTask: undefined;
  TaskDetails: { taskId: string };
  Progress: undefined;
  Coach: { context?: string };
};

type DailyTaskScreenNavigationProp = StackNavigationProp<BouncePlanStackParamList, 'DailyTask'>;
type DailyTaskScreenRouteProp = RouteProp<BouncePlanStackParamList, 'DailyTask'>;

interface DailyTaskScreenProps {
  navigation: DailyTaskScreenNavigationProp;
  route: DailyTaskScreenRouteProp;
}

export const DailyTaskScreen: React.FC<DailyTaskScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const { 
    currentDay, 
    getTaskStatus, 
    canAccessTask, 
    loadProgress, 
    isLoading,
    completeTask,
    skipTask 
  } = useBouncePlanStore();

  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const successScaleAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (user?.id) {
      loadProgress(user.id);
    }

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, [user?.id]);

  // Get current task
  const currentTask = BOUNCE_PLAN_TASKS.find(task => task.day === currentDay);
  const currentTaskStatus = currentTask ? getTaskStatus(currentTask.id) : undefined;
  const isCurrentTaskCompleted = currentTaskStatus?.completed || false;
  
  // Get yesterday's task
  const yesterdayTask = currentDay > 1 ? BOUNCE_PLAN_TASKS.find(task => task.day === currentDay - 1) : null;
  const yesterdayStatus = yesterdayTask ? getTaskStatus(yesterdayTask.id) : undefined;
  
  // Get tomorrow's task
  const tomorrowTask = currentDay < 30 ? BOUNCE_PLAN_TASKS.find(task => task.day === currentDay + 1) : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleTaskPress = async (task: BouncePlanTaskDefinition) => {
    if (!user?.id || isCurrentTaskCompleted) return;

    // For now, just complete the task inline rather than navigating
    // There's no separate TaskDetails screen defined
    await handleCompleteTask();
  };

  const handleCompleteTask = async () => {
    if (!user?.id || !currentTask || isCompletingTask) return;

    setIsCompletingTask(true);
    try {
      await completeTask(user.id, currentTask.id);
      
      // Success animation
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setIsCompletingTask(false);
    }
  };

  const handleSkipTask = async () => {
    if (!user?.id || !currentTask) return;

    try {
      await skipTask(user.id, currentTask.id, 'Skipping for today');
    } catch (error) {
      console.error('Error skipping task:', error);
    }
  };

  const handleAskCoach = () => {
    if (currentTask) {
      navigation.navigate('Coach', { 
        context: `I need help with today's task: ${currentTask.title}` 
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
            </Text>
            <Text style={[styles.dayCount, { color: theme.colors.textSecondary }]}>
              Day {currentDay} of your bounce plan
            </Text>
          </View>

          {/* Current Task Card */}
          {currentTask && !isCurrentTaskCompleted && (
            currentTask.isWeekend ? (
              <WeekendCard dayNumber={currentTask.day} />
            ) : (
              <ActiveTaskCard
                task={currentTask}
                onStartTask={() => handleTaskPress(currentTask)}
                onSkipTask={handleSkipTask}
                onAskCoach={handleAskCoach}
              />
            )
          )}

          {/* Completion State */}
          {currentTask && isCurrentTaskCompleted && (
            <TaskCompletionCard
              taskTitle={currentTask.title}
              notes={currentTaskStatus?.notes}
              onNextTask={() => navigation.navigate('TaskHistory')}
              scaleAnimation={successScaleAnim}
            />
          )}

          {/* Progress Context */}
          <View style={styles.progressContext}>
            {yesterdayTask && yesterdayStatus?.completed && (
              <View style={styles.contextItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={[styles.contextText, { color: theme.colors.textSecondary }]}>
                  Yesterday: {yesterdayTask.title}
                </Text>
              </View>
            )}
            {tomorrowTask && (
              <View style={styles.contextItem}>
                <Ionicons name="arrow-forward-circle-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.contextText, { color: theme.colors.textSecondary }]}>
                  Tomorrow: {tomorrowTask.title}
                </Text>
              </View>
            )}
          </View>

          {/* Progress Visualization */}
          <WeeklyProgressDots 
            currentDay={currentDay} 
            getTaskStatus={getTaskStatus} 
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.fontSizes.displaySM,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.xs,
  },
  dayCount: {
    fontSize: Typography.fontSizes.body,
  },
  progressContext: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contextText: {
    fontSize: Typography.fontSizes.bodySM,
  },
});

export default withErrorBoundary(DailyTaskScreen, {
  errorMessage: {
    title: 'Daily task loading issue',
    message: "We're working on loading today's task. Please try refreshing."
  }
});