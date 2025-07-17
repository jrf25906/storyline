import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWellnessStore } from '../../stores/wellnessStore';
import { MoodSelector, MoodTrendsChart, CrisisAlert } from '../../components/feature/wellness';
import { MoodValue, MOOD_EMOJIS } from '../../types';
import { Feather } from '@expo/vector-icons';
import type { MainTabScreenProps } from '../../types/navigation';
import { withErrorBoundary } from '../../components/common';
import { 
  H1,
  H2,
  Body,
  BodySM,
  Caption
} from '../../components/common/Typography';

type Props = MainTabScreenProps<'Wellness'>;

function WellnessScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const {
    currentMood,
    recentMoods,
    trends,
    streakDays,
    isLoading,
    error,
    addMoodEntry,
    loadRecentMoods,
    calculateTrends,
    detectCrisisKeywords,
    clearError,
  } = useWellnessStore();

  const [selectedMood, setSelectedMood] = useState<MoodValue | undefined>();
  const [moodNote, setMoodNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [crisisDetection, setCrisisDetection] = useState<ReturnType<typeof detectCrisisKeywords>>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load initial data
    loadRecentMoods();
    calculateTrends('week');
    calculateTrends('month');
  }, []);

  useEffect(() => {
    // Check for crisis keywords as user types
    if (moodNote.length > 10) {
      const detection = detectCrisisKeywords(moodNote);
      setCrisisDetection(detection);
    } else {
      setCrisisDetection(undefined);
    }
  }, [moodNote, detectCrisisKeywords]);

  const handleMoodSelect = (mood: MoodValue) => {
    setSelectedMood(mood);
    setShowNoteInput(true);
  };

  const handleSubmitMood = async () => {
    if (!selectedMood) return;

    setIsSubmitting(true);
    try {
      await addMoodEntry({
        value: selectedMood,
        note: moodNote.trim() || undefined,
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Reset form
      setSelectedMood(undefined);
      setMoodNote('');
      setShowNoteInput(false);
      setCrisisDetection(undefined);

      // Refresh data
      await Promise.all([
        loadRecentMoods(),
        calculateTrends('week'),
        calculateTrends('month'),
      ]);
    } catch (error) {
      console.error('Failed to submit mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadRecentMoods(),
        calculateTrends('week'),
        calculateTrends('month'),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleContactSupport = (action: string) => {
    if (action.includes('AI Coach')) {
      navigation.navigate('Coach');
    }
  };

  const renderMoodHistory = () => {
    if (recentMoods.length === 0) {
      return null;
    }

    return (
      <View style={styles.historySection} testID="mood-history">
        <H2 style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Moods
        </H2>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentMoods.slice(0, 7).map((mood, index) => (
            <View
              key={mood.id}
              style={[
                styles.historyItem,
                { backgroundColor: theme.colors.surface },
              ]}
              testID={`mood-entry-${mood.id}`}
            >
              <Body style={styles.historyEmoji}>{MOOD_EMOJIS[mood.value]}</Body>
              <Caption style={[styles.historyDate, { color: theme.colors.textSecondary }]}>
                {new Date(mood.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Caption>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    const userFriendlyMessage = error.includes('Network') 
      ? "Something went wrong, but we're here to help."
      : "Unable to save your mood. Please try again.";

    return (
      <View style={[styles.errorContainer, { backgroundColor: '#FFF3E0' }]}>
        <BodySM style={[styles.errorText, { color: '#E65100' }]}>
          {userFriendlyMessage}
        </BodySM>
        <TouchableOpacity onPress={clearError}>
          <BodySM style={[styles.errorDismiss, { color: '#E65100' }]}>
            Dismiss
          </BodySM>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header with streak */}
        {streakDays > 0 && (
          <View style={[styles.streakContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Feather name="zap" size={20} color={theme.colors.primary} />
            <Body style={[styles.streakText, { color: theme.colors.primary }]}>
              {streakDays} day streak!
            </Body>
          </View>
        )}

        {/* Crisis Alert */}
        {crisisDetection && (
          <CrisisAlert
            detection={crisisDetection}
            onDismiss={() => setCrisisDetection(undefined)}
            onContactSupport={handleContactSupport}
          />
        )}

        {/* Error Message */}
        {renderError()}

        {/* Success Message */}
        {showSuccess && (
          <View style={[styles.successContainer, { backgroundColor: '#4CAF5020' }]}>
            <Feather name="check-circle" size={20} color="#4CAF50" />
            <BodySM style={[styles.successText, { color: '#4CAF50' }]}>
              Mood logged successfully
            </BodySM>
          </View>
        )}

        {/* Mood Check-in */}
        <View style={styles.checkInSection}>
          <H1 style={[styles.title, { color: theme.colors.text }]}>
            How are you feeling today?
          </H1>
          
          <MoodSelector
            selectedMood={selectedMood}
            onSelect={handleMoodSelect}
            disabled={isSubmitting}
          />

          {showNoteInput && (
            <View style={styles.noteSection}>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="What's on your mind? (optional)"
                placeholderTextColor={theme.colors.textSecondary}
                value={moodNote}
                onChangeText={setMoodNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: selectedMood ? theme.colors.primary : theme.colors.border,
                opacity: !selectedMood || isSubmitting ? 0.5 : 1,
              },
            ]}
            onPress={handleSubmitMood}
            disabled={!selectedMood || isSubmitting}
            accessibilityState={{ disabled: !selectedMood || isSubmitting }}
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.colors.background} />
            ) : (
              <Body style={[styles.submitButtonText, { color: theme.colors.background }]}>
                Log Mood
              </Body>
            )}
          </TouchableOpacity>
        </View>

        {/* Mood History */}
        {renderMoodHistory()}

        {/* Mood Trends */}
        {trends.week && (
          <View style={styles.trendsSection}>
            <H2 style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Your Mood Trends
            </H2>
            <MoodTrendsChart trend={trends.week} isLoading={isLoading} />
            {trends.month && (
              <MoodTrendsChart trend={trends.month} isLoading={isLoading} />
            )}
          </View>
        )}

        {/* Loading State */}
        {isLoading && recentMoods.length === 0 && (
          <View style={styles.loadingContainer} testID="loading-indicator">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  streakText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  errorDismiss: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  successText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  checkInSection: {
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  noteSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  submitButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historySection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  historyItem: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  historyEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
  },
  trendsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});

export default withErrorBoundary(WellnessScreen, {
  errorMessage: {
    title: 'Wellness tracker needs a moment',
    message: "We're having trouble loading your wellness data. Please try again."
  }
});