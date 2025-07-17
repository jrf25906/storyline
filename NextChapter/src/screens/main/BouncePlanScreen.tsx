import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBouncePlanStore } from '../../stores/bouncePlanStore';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { BOUNCE_PLAN_TASKS, WEEK_TITLES, getWeekFromDay } from '../../constants/bouncePlanTasks';
import TaskCard from '../../components/feature/bounce-plan/TaskCard';
import TaskDetailModal from '../../components/feature/bounce-plan/TaskDetailModal';
import { 
  NetworkStatusBar, 
  withErrorBoundary
} from '../../components/common';
import { 
  H1,
  H2,
  Body,
  BodySM,
  Caption
} from '../../components/common/Typography';
import { Spacing } from '../../theme';
// Database sync is now handled by the store

function BouncePlanScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isConnected } = useOffline();
  const [selectedTask, setSelectedTask] = useState<typeof BOUNCE_PLAN_TASKS[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    startDate,
    currentDay,
    tasks,
    localProgress,
    isLoading: isStoreLoading,
    isSyncing,
    error: syncError,
    // Actions
    loadProgress: loadStoreProgress,
    completeTask,
    skipTask,
    undoTaskAction,
    syncProgress,
    resetProgress,
    initializePlan,
    // Computed values
    getTaskStatus,
    canAccessTask,
    getCompletedTasksCount,
    getSkippedTasksCount,
  } = useBouncePlanStore();
  
  // Load progress from database on mount
  useEffect(() => {
    loadProgress();
  }, [user]);
  
  const loadProgress = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load progress from store (which handles database sync)
      await loadStoreProgress(user.id);
      
      // If user has no start date after loading, initialize the plan
      if (!startDate) {
        const today = new Date();
        initializePlan(today);
        
        // Show welcome message
        Alert.alert(
          'Welcome to Your 30-Day Bounce Plan! 🚀',
          'Each day, you\'ll unlock a new 10-minute task designed to help you regain stability and momentum. Tasks unlock at 9 AM each day.',
          [{ text: 'Let\'s Go!', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error loading bounce plan progress:', error);
      Alert.alert(
        'Connection Error',
        'Unable to load your progress. Working offline.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProgress();
    setIsRefreshing(false);
  };
  
  // Helper function to determine task display status
  const getTaskDisplayStatus = (taskId: string, taskDay: number): 'locked' | 'available' | 'completed' | 'skipped' => {
    // Check if task is accessible based on day
    if (!canAccessTask(taskDay)) {
      return 'locked';
    }
    
    // Check task progress
    const taskProgress = getTaskStatus(taskId);
    if (taskProgress) {
      if (taskProgress.completed) return 'completed';
      if (taskProgress.skipped) return 'skipped';
    }
    
    return 'available';
  };

  const handleTaskPress = (task: typeof BOUNCE_PLAN_TASKS[0]) => {
    const status = getTaskDisplayStatus(task.id, task.day);
    if (status === 'locked') {
      Alert.alert(
        'Task Locked',
        `This task will unlock on Day ${task.day} at 9 AM.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedTask(task);
    setModalVisible(true);
  };
  
  const handleCompleteTask = async (taskId: string, notes?: string) => {
    if (!user) return;
    
    try {
      // The store handles optimistic updates and syncing
      await completeTask(user.id, taskId, notes);
      
      // Show encouragement
      const task = BOUNCE_PLAN_TASKS.find(t => t.id === taskId);
      if (task) {
        const messages = [
          'Great job! 🎉',
          'You\'re making progress! 💪',
          'Keep up the momentum! 🚀',
          'Another step forward! ✨',
          'You\'re doing amazing! 🌟',
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];
        Alert.alert(message, undefined, [{ text: 'Thanks!' }]);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert(
        'Unable to Complete Task',
        'Your progress will be saved when you\'re back online.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleSkipTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      // The store handles optimistic updates and syncing
      await skipTask(user.id, taskId);
    } catch (error) {
      console.error('Error skipping task:', error);
      Alert.alert(
        'Unable to Skip Task',
        'Your progress will be saved when you\'re back online.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleReopenTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      // The store handles optimistic updates and syncing
      await undoTaskAction(user.id, taskId);
    } catch (error) {
      console.error('Error reopening task:', error);
      Alert.alert(
        'Unable to Reopen Task',
        'Your progress will be saved when you\'re back online.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Calculate progress stats
  const totalTasks = BOUNCE_PLAN_TASKS.filter(t => !t.isWeekend).length;
  const completedCount = getCompletedTasksCount();
  const progressPercentage = Math.round((completedCount / totalTasks) * 100);
  
  // Group tasks by week
  const tasksByWeek: Record<number, typeof BOUNCE_PLAN_TASKS> = {};
  BOUNCE_PLAN_TASKS.forEach(task => {
    const week = getWeekFromDay(task.day);
    if (!tasksByWeek[week]) {
      tasksByWeek[week] = [];
    }
    tasksByWeek[week].push(task);
  });
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Network Status Bar */}
      <NetworkStatusBar />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={{ flex: 1 }}>
          <H1 style={styles.headerTitle}>
            30-Day Bounce Plan
          </H1>
          <Caption style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Day {currentDay} of 30 • {progressPercentage}% Complete
          </Caption>
        </View>
        <View style={[styles.progressCircle, { borderColor: theme.colors.primary }]}>
          <H2 style={[styles.progressText, { color: theme.colors.primary }]}>
            {completedCount}
          </H2>
          <Caption style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
            done
          </Caption>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: theme.colors.primary,
              width: `${progressPercentage}%`
            }
          ]} 
        />
      </View>
      
      {/* Task List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {Object.entries(tasksByWeek).map(([week, tasks]) => (
          <View key={week} style={styles.weekSection}>
            <View style={styles.weekHeader}>
              <H2 style={styles.weekTitle}>
                Week {week}: {WEEK_TITLES[parseInt(week) as keyof typeof WEEK_TITLES]}
              </H2>
              <Caption style={[styles.weekProgress, { color: theme.colors.textSecondary }]}>
                {tasks.filter(t => !t.isWeekend && getTaskDisplayStatus(t.id, t.day) === 'completed').length} of{' '}
                {tasks.filter(t => !t.isWeekend).length} tasks
              </Caption>
            </View>
            
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                status={getTaskDisplayStatus(task.id, task.day)}
                onPress={() => handleTaskPress(task)}
              />
            ))}
          </View>
        ))}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedTask(null);
        }}
        onComplete={handleCompleteTask}
        onSkip={handleSkipTask}
        onReopen={handleReopenTask}
      />
    </SafeAreaView>
  );
}

export default withErrorBoundary(BouncePlanScreen, {
  errorMessage: {
    title: 'Bounce Plan loading issue',
    message: "Your progress is saved. Please try refreshing the screen."
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  syncText: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 11,
  },
  progressBar: {
    height: 6,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  weekSection: {
    marginBottom: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekProgress: {
    fontSize: 14,
  },
  bottomSpacing: {
    height: 100,
  },
});