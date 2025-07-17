import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';
import { useEmotionalState } from '../../../context/EmotionalStateContext';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { useBouncePlanStore } from '../../../stores/bouncePlanStore';
import { useBudgetStore } from '../../../stores/budgetStore';
import { useWellnessStore } from '../../../stores/wellnessStore';
import { useJobTrackerStore } from '../../../stores/jobTrackerStore';

// Mock all dependencies
jest.mock('../../../context/EmotionalStateContext');
jest.mock('../../../hooks/useAccessibility');
jest.mock('../../../stores/bouncePlanStore');
jest.mock('../../../stores/budgetStore');
jest.mock('../../../stores/wellnessStore');
jest.mock('../../../stores/jobTrackerStore');
jest.mock('../../../context/ThemeContext');
jest.mock('../../../hooks/useAuth');
jest.mock('@react-navigation/native');

const mockUseEmotionalState = useEmotionalState as jest.MockedFunction<typeof useEmotionalState>;
const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;
const mockUseBouncePlanStore = useBouncePlanStore as jest.MockedFunction<typeof useBouncePlanStore>;
const mockUseBudgetStore = useBudgetStore as jest.MockedFunction<typeof useBudgetStore>;
const mockUseWellnessStore = useWellnessStore as jest.MockedFunction<typeof useWellnessStore>;
const mockUseJobTrackerStore = useJobTrackerStore as jest.MockedFunction<typeof useJobTrackerStore>;

describe('HomeScreen - Emotional Intelligence Integration', () => {
  const mockAnnounceForAccessibility = jest.fn();
  const mockAddMoodEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock emotional state
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'normal',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'normal',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 5,
      recentAchievements: [],
    });

    // Mock accessibility
    mockUseAccessibility.mockReturnValue({
      announceForAccessibility: mockAnnounceForAccessibility,
      triggerHapticFeedback: jest.fn(),
      setAccessibilityFocus: jest.fn(),
      checkScreenReaderEnabled: jest.fn(),
      checkReduceMotionEnabled: jest.fn(),
    });

    // Mock stores with default values
    mockUseBouncePlanStore.mockReturnValue({
      startDate: new Date(),
      currentDay: 5,
      getTaskStatus: jest.fn(),
      getCompletedTasksCount: jest.fn().mockReturnValue(3),
      isLoading: false,
    });

    mockUseBudgetStore.mockReturnValue({
      runway: { totalMonths: 8.5 },
      alerts: [],
      isLoading: false,
    });

    mockUseWellnessStore.mockReturnValue({
      currentMood: null,
      lastCheckInDate: null,
      streakDays: 0,
      isLoading: false,
      addMoodEntry: mockAddMoodEntry,
    });

    mockUseJobTrackerStore.mockReturnValue({
      applications: [],
      isLoading: false,
    });

    // Mock theme and auth
    require('../../../context/ThemeContext').useTheme.mockReturnValue({
      theme: {
        colors: {
          primary: '#007AFF',
          success: '#34C759',
          warning: '#FF9500',
          error: '#FF3B30',
          border: '#E5E5E7',
        },
      },
    });

    require('../../../hooks/useAuth').useAuth.mockReturnValue({
      user: { email: 'test@example.com' },
    });

    require('@react-navigation/native').useNavigation.mockReturnValue({
      navigate: jest.fn(),
    });
  });

  it('renders with emotional state detector', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('home-screen-container')).toBeTruthy();
  });

  it('announces crisis mode when emotional state is crisis', async () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'crisis',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'crisis',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 9,
      recentAchievements: [],
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
        'Crisis support is available. Tap the screen for immediate help.'
      );
    });
  });

  it('announces success mode when emotional state is success', async () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'success',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'success',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 2,
      recentAchievements: ['Got an interview!'],
    });

    render(<HomeScreen />);

    await waitFor(() => {
      expect(mockAnnounceForAccessibility).toHaveBeenCalledWith(
        'Success mode active. Celebrating your achievements!'
      );
    });
  });

  it('shows crisis mode modal when emotional state is crisis', async () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'crisis',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'crisis',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 9,
      recentAchievements: [],
    });

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText("You're Safe Here")).toBeTruthy();
    });
  });

  it('shows success celebration for recent achievements', async () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'success',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'success',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 2,
      recentAchievements: ['Completed 5 tasks this week!'],
    });

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Congratulations!')).toBeTruthy();
      expect(getByText('Completed 5 tasks this week!')).toBeTruthy();
    });
  });

  it('triggers celebration when positive mood is logged', async () => {
    mockAddMoodEntry.mockResolvedValue(undefined);

    const { getByLabelText } = render(<HomeScreen />);

    const happyMoodButton = getByLabelText('Mood level 5');
    fireEvent.press(happyMoodButton);

    await waitFor(() => {
      expect(mockAddMoodEntry).toHaveBeenCalledWith({ value: 5 });
    });

    // Should show celebration modal
    await waitFor(() => {
      const celebrationModal = getByLabelText('Success celebration');
      expect(celebrationModal).toBeTruthy();
    });
  });

  it('does not trigger celebration for negative mood', async () => {
    mockAddMoodEntry.mockResolvedValue(undefined);

    const { getByLabelText, queryByText } = render(<HomeScreen />);

    const sadMoodButton = getByLabelText('Mood level 2');
    fireEvent.press(sadMoodButton);

    await waitFor(() => {
      expect(mockAddMoodEntry).toHaveBeenCalledWith({ value: 2 });
    });

    // Should not show celebration modal
    expect(queryByText('Congratulations!')).toBeNull();
  });

  it('applies adaptive spacing based on emotional state', () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'crisis',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'crisis',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 9,
      recentAchievements: [],
    });

    const { getByTestId } = render(<HomeScreen />);
    
    // In crisis mode, adaptive spacing should be applied
    const container = getByTestId('home-screen-container');
    expect(container).toBeTruthy();
  });

  it('handles mood entry errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAddMoodEntry.mockRejectedValue(new Error('Network error'));

    const { getByLabelText } = render(<HomeScreen />);

    const moodButton = getByLabelText('Mood level 4');
    fireEvent.press(moodButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to log mood:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('shows emotional state indicator when enabled', () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'struggling',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'struggling',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 7,
      recentAchievements: [],
    });

    const { getByText } = render(<HomeScreen />);
    
    // Should show the emotional state indicator
    expect(getByText('STRUGGLING MODE')).toBeTruthy();
  });

  it('closes crisis mode when requested', async () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'crisis',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'crisis',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 9,
      recentAchievements: [],
    });

    const { getByText, queryByText } = render(<HomeScreen />);

    // Crisis mode should be visible
    await waitFor(() => {
      expect(getByText("You're Safe Here")).toBeTruthy();
    });

    // Close crisis mode
    const stayButton = getByText('Stay in Crisis Mode');
    fireEvent.press(stayButton);

    await waitFor(() => {
      expect(queryByText("You're Safe Here")).toBeNull();
    });
  });

  it('closes celebration when continue button is pressed', async () => {
    mockUseEmotionalState.mockReturnValue({
      emotionalState: 'success',
      setEmotionalState: jest.fn(),
      autoDetectedState: 'success',
      isAutoDetectionEnabled: true,
      setAutoDetectionEnabled: jest.fn(),
      stressLevel: 2,
      recentAchievements: ['Test achievement'],
    });

    const { getByText, queryByText } = render(<HomeScreen />);

    // Celebration should be visible
    await waitFor(() => {
      expect(getByText('Congratulations!')).toBeTruthy();
    });

    // Close celebration
    const continueButton = getByText('Continue Your Journey');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(queryByText('Congratulations!')).toBeNull();
    });
  });
});