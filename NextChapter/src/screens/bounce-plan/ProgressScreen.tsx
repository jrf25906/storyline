import React, { useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Animated,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useAuthStore } from '@stores/authStore';
import { BOUNCE_PLAN_TASKS } from '@constants/bouncePlanTasks';
import Card from '@components/common/Card';
import { Typography, Spacing, Colors } from '@theme';
import { withErrorBoundary } from '@components/common';
import { 
  H1,
  H2,
  Body,
  BodySM,
  Caption
} from '@components/common/Typography';

type BouncePlanStackParamList = {
  DailyTask: undefined;
  TaskDetails: { taskId: string };
  Progress: undefined;
};

type ProgressScreenNavigationProp = StackNavigationProp<BouncePlanStackParamList, 'Progress'>;
type ProgressScreenRouteProp = RouteProp<BouncePlanStackParamList, 'Progress'>;

interface ProgressScreenProps {
  navigation: ProgressScreenNavigationProp;
  route: ProgressScreenRouteProp;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { 
    currentDay, 
    getTaskStatus, 
    getCompletedTasksCount,
    getSkippedTasksCount,
    getCompletionRate,
    getDaysActive
  } = useBouncePlanStore();

  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const completedCount = getCompletedTasksCount();
  const skippedCount = getSkippedTasksCount();
  const completionRate = getCompletionRate();
  const daysActive = getDaysActive();

  // Group tasks by week
  const weeks = [];
  for (let week = 0; week < 5; week++) {
    const weekTasks = BOUNCE_PLAN_TASKS.filter(
      task => task.day > week * 7 && task.day <= (week + 1) * 7
    );
    weeks.push({
      weekNumber: week + 1,
      tasks: weekTasks,
    });
  }

  const getWeekProgress = (weekNumber: number) => {
    const weekTasks = weeks[weekNumber - 1].tasks.filter(t => !t.isWeekend);
    const completedInWeek = weekTasks.filter(task => {
      const status = getTaskStatus(task.id);
      return status?.completed;
    }).length;
    return { completed: completedInWeek, total: weekTasks.length };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
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
            <H1 style={styles.title}>
              Your Progress
            </H1>
          </View>

          {/* Overall Stats */}
          <Card variant="elevated" style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <H2 style={[styles.statValue, { color: theme.colors.primary }]}>
                  {completionRate}%
                </H2>
                <Caption style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Completion Rate
                </Caption>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <H2 style={[styles.statValue, { color: theme.colors.success }]}>
                  {completedCount}
                </H2>
                <Caption style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Tasks Done
                </Caption>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <H2 style={[styles.statValue, { color: theme.colors.text }]}>
                  {daysActive}
                </H2>
                <Caption style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Days Active
                </Caption>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: theme.colors.primary,
                      width: `${completionRate}%`
                    }
                  ]} 
                />
              </View>
              <Caption style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                {currentDay} of 30 days
              </Caption>
            </View>
          </Card>

          {/* Weekly Breakdown */}
          <View style={styles.weeklySection}>
            <H2 style={styles.sectionTitle}>
              Weekly Breakdown
            </H2>
            {weeks.map((week) => {
              const weekProgress = getWeekProgress(week.weekNumber);
              const isCurrentWeek = currentDay > (week.weekNumber - 1) * 7 && 
                                  currentDay <= week.weekNumber * 7;
              const isUnlocked = currentDay > (week.weekNumber - 1) * 7;
              
              return (
                <Card 
                  key={week.weekNumber} 
                  variant={isCurrentWeek ? 'task' : 'outlined'}
                  style={[
                    styles.weekCard,
                    !isUnlocked && styles.weekCardLocked
                  ]}
                >
                  <View style={styles.weekHeader}>
                    <View>
                      <Body style={styles.weekTitle}>
                        Week {week.weekNumber}
                      </Body>
                      <BodySM style={[styles.weekSubtitle, { color: theme.colors.textSecondary }]}>
                        {getWeekTheme(week.weekNumber)}
                      </BodySM>
                    </View>
                    {isUnlocked ? (
                      <View style={styles.weekProgress}>
                        <Caption style={[styles.weekProgressText, { color: theme.colors.primary }]}>
                          {weekProgress.completed}/{weekProgress.total}
                        </Caption>
                      </View>
                    ) : (
                      <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />
                    )}
                  </View>

                  {isUnlocked && (
                    <View style={styles.weekTasks}>
                      {week.tasks.filter(t => !t.isWeekend).map((task) => {
                        const status = getTaskStatus(task.id);
                        const isCompleted = status?.completed || false;
                        const isSkipped = status?.skipped || false;
                        const isCurrent = task.day === currentDay;

                        return (
                          <TouchableOpacity
                            key={task.id}
                            style={[
                              styles.weekTask,
                              isCurrent && styles.weekTaskCurrent,
                              { borderColor: theme.colors.border }
                            ]}
                            onPress={() => navigation.navigate('DailyTask', { taskId: task.id, day: task.day })}
                            disabled={task.day > currentDay}
                            accessibilityLabel={`Day ${task.day}: ${task.title}`}
                            accessibilityRole="button"
                          >
                            <View style={styles.weekTaskContent}>
                              <Caption 
                                style={[
                                  styles.weekTaskDay, 
                                  { color: theme.colors.textSecondary }
                                ]}
                              >
                                Day {task.day}
                              </Caption>
                              <BodySM 
                                style={[
                                  styles.weekTaskTitle, 
                                  { 
                                    color: isCompleted || isSkipped 
                                      ? theme.colors.textSecondary 
                                      : theme.colors.text,
                                    textDecorationLine: isCompleted || isSkipped 
                                      ? 'line-through' 
                                      : 'none'
                                  }
                                ]}
                                numberOfLines={1}
                              >
                                {task.title}
                              </BodySM>
                            </View>
                            {isCompleted && (
                              <Ionicons 
                                name="checkmark-circle" 
                                size={20} 
                                color={theme.colors.success} 
                              />
                            )}
                            {isSkipped && (
                              <Ionicons 
                                name="close-circle" 
                                size={20} 
                                color={theme.colors.textSecondary} 
                              />
                            )}
                            {task.day > currentDay && (
                              <Ionicons 
                                name="lock-closed-outline" 
                                size={16} 
                                color={theme.colors.textSecondary} 
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

function getWeekTheme(weekNumber: number): string {
  const themes = [
    'Stabilization & Mindset Reset',
    'Building Momentum',
    'Deep Dive & Strategy',
    'Acceleration & Outreach',
    'Final Push & Next Steps'
  ];
  return themes[weekNumber - 1] || '';
}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSizes.headingLG,
    fontWeight: Typography.fontWeights.bold,
  },
  statsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: Typography.fontSizes.displaySM,
    fontWeight: Typography.fontWeights.bold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSizes.caption,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  progressBarContainer: {
    marginTop: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.fontSizes.caption,
    textAlign: 'center',
  },
  weeklySection: {
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.headingMD,
    fontWeight: Typography.fontWeights.semiBold,
    marginBottom: Spacing.md,
  },
  weekCard: {
    marginBottom: Spacing.md,
  },
  weekCardLocked: {
    opacity: 0.6,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weekTitle: {
    fontSize: Typography.fontSizes.bodyLG,
    fontWeight: Typography.fontWeights.semiBold,
  },
  weekSubtitle: {
    fontSize: Typography.fontSizes.bodySM,
    marginTop: 2,
  },
  weekProgress: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
  },
  weekProgressText: {
    fontSize: Typography.fontSizes.caption,
    fontWeight: Typography.fontWeights.semiBold,
  },
  weekTasks: {
    gap: Spacing.xs,
  },
  weekTask: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  weekTaskCurrent: {
    backgroundColor: Colors.primary + '10',
  },
  weekTaskContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  weekTaskDay: {
    fontSize: Typography.fontSizes.caption,
    marginBottom: 2,
  },
  weekTaskTitle: {
    fontSize: Typography.fontSizes.bodySM,
  },
});

export default withErrorBoundary(ProgressScreen, {
  errorMessage: {
    title: 'Progress tracking issue',
    message: "Your progress is saved. We're working on displaying it properly."
  }
});