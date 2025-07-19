import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Svg, Circle } from 'react-native-svg';

// Contexts and Hooks
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@hooks/useAuth';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useBudgetStore } from '@stores/budgetStore';
import { useWellnessStore } from '@stores/wellnessStore';
import { useJobTrackerStore } from '@stores/jobTrackerStore';
import { withErrorBoundary } from '@components/common';

// Emotional Intelligence Components
import { EmotionalStateDetector } from '@components/emotional/EmotionalStateDetector';
import { AdaptiveUIWrapper, useAdaptiveSpacing } from '@components/emotional/AdaptiveUIWrapper';
import { CrisisMode } from '@components/emotional/CrisisMode';
import { SuccessCelebration } from '@components/emotional/SuccessCelebration';
import { useEmotionalState } from '@context/EmotionalStateContext';
import { useAccessibility } from '@hooks/useAccessibility';

// Components
import { DashboardCard } from '@components/common';
import { 
  H1,
  H2,
  Body,
  BodySM,
  Caption,
  Muted
} from '@components/common/Typography';
import { createStyles } from '@screens/main/HomeScreen.styles';

// Types
import { RootStackParamList } from '@types/navigation';
import { MoodValue } from '@types/wellness';
import { JobApplicationStatus } from '@types/database';
import { BOUNCE_PLAN_TASKS, getTaskByDay } from '@constants/bouncePlanTasks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MOOD_EMOJIS: Record<MoodValue, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

function HomeScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  // Emotional Intelligence hooks
  const { emotionalState, recentAchievements } = useEmotionalState();
  const { announceForAccessibility } = useAccessibility();
  const adaptiveSpacing = useAdaptiveSpacing();

  // Store hooks
  const {
    startDate,
    currentDay,
    getTaskStatus,
    getCompletedTasksCount,
    isLoading: bouncePlanLoading,
  } = useBouncePlanStore();

  const { runway, alerts, isLoading: budgetLoading } = useBudgetStore();

  const {
    currentMood,
    lastCheckInDate,
    streakDays,
    isLoading: wellnessLoading,
    addMoodEntry,
  } = useWellnessStore();

  const { applications, isLoading: jobsLoading } = useJobTrackerStore();

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [showCrisisMode, setShowCrisisMode] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    visible: boolean;
    achievement: string;
    message?: string;
  }>({ visible: false, achievement: '' });

  // Calculate derived values
  const todayTask = useMemo(() => getTaskByDay(currentDay), [currentDay]);
  const hasCheckedInToday = useMemo(() => {
    if (!lastCheckInDate) return false;
    const today = new Date();
    return (
      lastCheckInDate.getDate() === today.getDate() &&
      lastCheckInDate.getMonth() === today.getMonth() &&
      lastCheckInDate.getFullYear() === today.getFullYear()
    );
  }, [lastCheckInDate]);

  const applicationsByStatus = useMemo(() => {
    const stats: Record<JobApplicationStatus, number> = {
      saved: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    };
    applications.forEach((app) => {
      if (stats[app.status] !== undefined) {
        stats[app.status]++;
      }
    });
    return stats;
  }, [applications]);

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => !alert.dismissed),
    [alerts]
  );

  // Greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.email?.split('@')[0] || 'there';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Progress calculation for bounce plan
  const completedTasksCount = getCompletedTasksCount();
  const progressPercentage = useMemo(() => {
    if (!startDate) return 0;
    return Math.round((completedTasksCount / 30) * 100);
  }, [completedTasksCount, startDate]);

  // Runway color calculation
  const getRunwayColor = () => {
    if (!runway) return theme.colors.border;
    if (runway.totalMonths < 3) return theme.colors.error;
    if (runway.totalMonths < 6) return theme.colors.warning;
    return theme.colors.success;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // In a real app, you'd refresh data from stores here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleMoodSelect = async (value: MoodValue) => {
    try {
      await addMoodEntry({ value });
      
      // Trigger celebration for positive mood entries
      if (value >= 4) {
        setCelebrationData({
          visible: true,
          achievement: 'Positive mood logged!',
          message: 'Great to see you feeling good today! Keep up the positive momentum.',
        });
      }
    } catch (error) {
      console.error('Failed to log mood:', error);
    }
  };

  // Handle crisis mode activation
  useEffect(() => {
    if (emotionalState === 'crisis') {
      setShowCrisisMode(true);
    }
  }, [emotionalState]);

  // Handle achievement celebrations
  useEffect(() => {
    if (recentAchievements.length > 0 && !celebrationData.visible) {
      const latestAchievement = recentAchievements[0];
      setCelebrationData({
        visible: true,
        achievement: latestAchievement,
        message: 'You\'re making incredible progress on your journey!',
      });
    }
  }, [recentAchievements, celebrationData.visible]);

  // Announce emotional state changes for accessibility
  useEffect(() => {
    const stateMessages = {
      crisis: 'Crisis support is available. Tap the screen for immediate help.',
      success: 'Success mode active. Celebrating your achievements!',
      struggling: 'Extra support is available. You\'re doing great.',
      normal: 'Dashboard loaded successfully.',
    };

    if (emotionalState !== 'normal') {
      announceForAccessibility(stateMessages[emotionalState]);
    }
  }, [emotionalState, announceForAccessibility]);

  return (
    <EmotionalStateDetector showIndicator={true}>
      <AdaptiveUIWrapper style={styles.container}>
        <SafeAreaView style={[styles.container, { padding: adaptiveSpacing.screenPadding }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            testID="home-screen-container"
            accessible={true}
            accessibilityLabel="Home Dashboard"
          >
            {/* Header */}
            <View style={styles.header}>
              <H1 style={styles.greeting}>{getGreeting()}</H1>
              <Caption style={styles.date}>{formatDate()}</Caption>
            </View>

            {/* Bounce Plan Card */}
            <DashboardCard
              title="30-Day Bounce Plan"
              subtitle={startDate ? `Day ${currentDay} of 30` : 'Not started'}
              onPress={() => navigation.navigate('BouncePlan')}
              testID="bounce-plan-card"
              loading={bouncePlanLoading}
              variant={completedTasksCount > 0 ? 'success' : 'default'}
              elevated={true}
              accessibilityLabel="Navigate to Bounce Plan"
              accessibilityHint="View and complete your daily recovery tasks"
            >
              {startDate ? (
                <View style={styles.bouncePlanContent}>
                  <View style={styles.bouncePlanLeft}>
                    <Body style={styles.dayProgress}>Day {currentDay} of 30</Body>
                    {todayTask && (
                      <>
                        <Caption style={styles.taskPreview}>Today's Task:</Caption>
                        <BodySM style={styles.taskStatus} numberOfLines={2}>
                          {todayTask.title}
                        </BodySM>
                      </>
                    )}
                    <Caption style={styles.taskStatus}>
                      {completedTasksCount} tasks completed
                    </Caption>
                  </View>
                  <Svg
                    width={80}
                    height={80}
                    style={styles.progressCircle}
                    testID="progress-circle"
                  >
                    <Circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke={theme.colors.border}
                      strokeWidth="6"
                      fill="none"
                    />
                    <Circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke={theme.colors.primary}
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(progressPercentage / 100) * 220} 220`}
                      transform="rotate(-90 40 40)"
                    />
                  </Svg>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Body style={styles.emptyStateText}>
                Ready to start your recovery journey?
                  </Body>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => navigation.navigate('BouncePlan')}
                  >
                    <BodySM style={styles.emptyStateButtonText}>Start your journey</BodySM>
                  </TouchableOpacity>
                </View>
              )}
            </DashboardCard>

            {/* Budget Runway Card */}
            <DashboardCard
              title="Financial Runway"
              subtitle="Your financial cushion"
              onPress={() => navigation.navigate('Budget')}
              testID="budget-card"
              loading={budgetLoading}
              variant={activeAlerts.length > 0 ? 'gentle' : 'default'}
              elevated={runway && runway.totalMonths < 6}
              accessibilityLabel="View Budget Details"
              accessibilityHint="Check your financial runway and budget alerts"
            >
              {runway ? (
                <View style={styles.budgetContent}>
                  <H2 style={styles.runwayAmount}>{runway.totalMonths.toFixed(1)} months</H2>
                  <Caption style={styles.runwayLabel}>of runway remaining</Caption>
                  <View style={styles.runwayBar} testID="runway-indicator">
                    <View
                      style={[
                        styles.runwayProgress,
                        {
                          width: `${Math.min((runway.totalMonths / 12) * 100, 100)}%`,
                          backgroundColor: getRunwayColor(),
                        },
                      ]}
                    />
                  </View>
                  {activeAlerts.length > 0 && (
                    <BodySM style={[styles.alertText, { color: '#D4736A' }]}>
                      {activeAlerts.length} alert{activeAlerts.length > 1 ? 's' : ''}
                    </BodySM>
                  )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Muted style={styles.emptyStateText}>
                Track your financial runway
                  </Muted>
                </View>
              )}
            </DashboardCard>

            {/* Mood Check-in Card */}
            <DashboardCard
              title="Daily Check-in"
              subtitle={hasCheckedInToday ? 'Checked in today' : 'How are you feeling?'}
              onPress={() => navigation.navigate('Wellness')}
              testID="mood-card"
              loading={wellnessLoading}
              variant={hasCheckedInToday ? 'success' : 'support'}
              accessibilityLabel="Log your mood"
              accessibilityHint="Track your emotional wellbeing"
            >
              {hasCheckedInToday && currentMood ? (
                <View style={styles.moodCheckedIn}>
                  <Text style={styles.currentMoodEmoji} testID="mood-emoji">
                    {MOOD_EMOJIS[currentMood.value]}
                  </Text>
                  {streakDays > 0 && (
                    <Caption style={[styles.moodStreak, { color: '#A8DADC' }]}>
                      {streakDays} day streak
                    </Caption>
                  )}
                </View>
              ) : (
                <View style={styles.moodContent}>
                  <Body style={styles.moodPrompt}>How are you feeling today?</Body>
                  <View style={styles.moodSelector}>
                    {([1, 2, 3, 4, 5] as MoodValue[]).map((value) => (
                      <TouchableOpacity
                        key={value}
                        style={styles.moodOption}
                        onPress={() => handleMoodSelect(value)}
                        accessibilityLabel={`Mood level ${value}`}
                      >
                        <Text style={styles.moodEmoji}>{MOOD_EMOJIS[value]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </DashboardCard>

            {/* Job Applications Card */}
            <DashboardCard
              title="Job Pipeline"
              subtitle="Application tracking"
              onPress={() => navigation.navigate('Tracker')}
              testID="job-tracker-card"
              loading={jobsLoading}
              variant={applicationsByStatus.offer > 0 ? 'success' : 'default'}
              elevated={applicationsByStatus.interviewing > 0}
              accessibilityLabel="View Job Applications"
              accessibilityHint="Track your job application progress"
            >
              <View>
                <Body style={styles.totalApplications}>
                  {applications.length} active application{applications.length !== 1 ? 's' : ''}
                </Body>
                <View style={styles.jobStats}>
                  {applicationsByStatus.applied > 0 && (
                    <View style={styles.jobStat}>
                      <View
                        style={[styles.jobStatDot, { backgroundColor: theme.colors.primary }]}
                      />
                      <BodySM style={styles.jobStatText}>
                        {applicationsByStatus.applied} Applied
                      </BodySM>
                    </View>
                  )}
                  {applicationsByStatus.interviewing > 0 && (
                    <View style={styles.jobStat}>
                      <View
                        style={[styles.jobStatDot, { backgroundColor: theme.colors.warning }]}
                      />
                      <BodySM style={styles.jobStatText}>
                        {applicationsByStatus.interviewing} Interviewing
                      </BodySM>
                    </View>
                  )}
                  {applicationsByStatus.offer > 0 && (
                    <View style={styles.jobStat}>
                      <View
                        style={[styles.jobStatDot, { backgroundColor: theme.colors.success }]}
                      />
                      <BodySM style={styles.jobStatText}>
                        {applicationsByStatus.offer} Offer
                      </BodySM>
                    </View>
                  )}
                </View>
              </View>
            </DashboardCard>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <H2 style={styles.sectionTitle}>Quick Actions</H2>
              <TouchableOpacity
                style={styles.coachButton}
                onPress={() => navigation.navigate('Coach')}
                testID="coach-quick-action"
                accessibilityLabel="Talk to AI Coach"
                accessibilityHint="Get personalized support and guidance"
              >
                <Body style={styles.coachButtonText}>Talk to Coach</Body>
                <Caption style={styles.coachButtonSubtext}>
              Get support and guidance anytime
                </Caption>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Crisis Mode Modal */}
          <CrisisMode
            visible={showCrisisMode}
            onClose={() => setShowCrisisMode(false)}
          />

          {/* Success Celebration Modal */}
          <SuccessCelebration
            visible={celebrationData.visible}
            onClose={() => setCelebrationData({ visible: false, achievement: '' })}
            achievement={celebrationData.achievement}
            message={celebrationData.message}
          />
        </SafeAreaView>
      </AdaptiveUIWrapper>
    </EmotionalStateDetector>
  );
}

export default withErrorBoundary(HomeScreen, {
  errorMessage: {
    title: 'Home screen loading issue',
    message: 'Your dashboard is taking a moment. Please refresh to continue.'
  }
});