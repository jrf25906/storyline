import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import WellnessScreen from '../WellnessScreen';
import { ThemeProvider } from '../../../context/ThemeContext';
import { useWellnessStore } from '../../../stores/wellnessStore';
import { MoodValue } from '../../../types';
import { Alert } from 'react-native';

// Mock the wellness store
jest.mock('../../../stores/wellnessStore');

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
  params: {},
};

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </NavigationContainer>
  );
};

describe('WellnessScreen', () => {
  const mockUseWellnessStore = useWellnessStore as jest.MockedFunction<typeof useWellnessStore>;
  
  const defaultMockStore = {
    currentMood: null,
    recentMoods: [],
    trends: {},
    lastCheckInDate: null,
    streakDays: 0,
    isLoading: false,
    error: null,
    addMoodEntry: jest.fn(),
    loadRecentMoods: jest.fn(),
    calculateTrends: jest.fn(),
    detectCrisisKeywords: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWellnessStore.mockReturnValue(defaultMockStore);
  });

  describe('Initial Render', () => {
    it('should render the wellness screen with mood check-in prompt', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('How are you feeling today?')).toBeTruthy();
      expect(getByTestId('mood-selector')).toBeTruthy();
    });

    it('should display all mood options with correct emojis', () => {
      const { getByTestId } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Check all mood options are rendered
      expect(getByTestId('mood-option-1')).toBeTruthy(); // Very Low
      expect(getByTestId('mood-option-2')).toBeTruthy(); // Low
      expect(getByTestId('mood-option-3')).toBeTruthy(); // Neutral
      expect(getByTestId('mood-option-4')).toBeTruthy(); // Good
      expect(getByTestId('mood-option-5')).toBeTruthy(); // Very Good
    });

    it('should have minimum touch target size of 48x48dp for mood options', () => {
      const { getByTestId } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      const moodOption = getByTestId('mood-option-3');
      const { width, height } = moodOption.props.style;
      
      expect(width).toBeGreaterThanOrEqual(48);
      expect(height).toBeGreaterThanOrEqual(48);
    });
  });

  describe('Mood Selection', () => {
    it('should highlight selected mood option', () => {
      const { getByTestId } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      const goodMoodOption = getByTestId('mood-option-4');
      fireEvent.press(goodMoodOption);

      expect(goodMoodOption.props.accessibilityState.selected).toBe(true);
    });

    it('should show note input after mood selection', () => {
      const { getByTestId, getByPlaceholderText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-3'));

      expect(getByPlaceholderText('What\'s on your mind? (optional)')).toBeTruthy();
    });

    it('should enable submit button after mood selection', () => {
      const { getByTestId, getByText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      const submitButton = getByText('Log Mood');
      expect(submitButton.props.accessibilityState.disabled).toBe(true);

      fireEvent.press(getByTestId('mood-option-3'));
      
      expect(submitButton.props.accessibilityState.disabled).toBe(false);
    });
  });

  describe('Mood Submission', () => {
    it('should save mood entry when submitted', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-4'));
      fireEvent.press(getByText('Log Mood'));

      await waitFor(() => {
        expect(defaultMockStore.addMoodEntry).toHaveBeenCalledWith({
          value: MoodValue.Good,
          note: '',
        });
      });
    });

    it('should save mood entry with note', async () => {
      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-2'));
      
      const noteInput = getByPlaceholderText('What\'s on your mind? (optional)');
      fireEvent.changeText(noteInput, 'Feeling overwhelmed with job search');
      
      fireEvent.press(getByText('Log Mood'));

      await waitFor(() => {
        expect(defaultMockStore.addMoodEntry).toHaveBeenCalledWith({
          value: MoodValue.Low,
          note: 'Feeling overwhelmed with job search',
        });
      });
    });

    it('should show success message after submission', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-4'));
      fireEvent.press(getByText('Log Mood'));

      await waitFor(() => {
        expect(getByText('Mood logged successfully')).toBeTruthy();
      });
    });
  });

  describe('Crisis Intervention', () => {
    it('should detect critical keywords and show crisis resources', async () => {
      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        detectCrisisKeywords: jest.fn().mockReturnValue({
          detected: true,
          severity: 'critical',
          matchedKeywords: ['suicide'],
          suggestedActions: ['Contact 988 Suicide & Crisis Lifeline'],
        }),
      });

      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-1'));
      
      const noteInput = getByPlaceholderText('What\'s on your mind? (optional)');
      fireEvent.changeText(noteInput, 'I feel like ending it all');

      await waitFor(() => {
        expect(getByTestId('crisis-alert')).toBeTruthy();
        expect(getByText('988')).toBeTruthy();
        expect(getByText('Suicide & Crisis Lifeline')).toBeTruthy();
      });
    });

    it('should show appropriate resources for high severity keywords', async () => {
      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        detectCrisisKeywords: jest.fn().mockReturnValue({
          detected: true,
          severity: 'high',
          matchedKeywords: ['hopeless'],
          suggestedActions: ['Talk to a counselor', 'Reach out to a friend'],
        }),
      });

      const { getByTestId, getByPlaceholderText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-1'));
      
      const noteInput = getByPlaceholderText('What\'s on your mind? (optional)');
      fireEvent.changeText(noteInput, 'Everything feels hopeless');

      await waitFor(() => {
        expect(getByTestId('support-resources')).toBeTruthy();
      });
    });

    it('should trigger coach with appropriate tone for emotional state', async () => {
      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        detectCrisisKeywords: jest.fn().mockReturnValue({
          detected: true,
          severity: 'high',
          matchedKeywords: ['hopeless'],
          suggestedActions: ['Talk to AI Coach'],
        }),
      });

      const { getByTestId, getByText, getByPlaceholderText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-1'));
      
      const noteInput = getByPlaceholderText('What\'s on your mind? (optional)');
      fireEvent.changeText(noteInput, 'Feeling hopeless');
      
      fireEvent.press(getByText('Talk to Coach'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Coach', {
          emotionalState: 'hopeless',
          suggestedTone: 'hype',
        });
      });
    });
  });

  describe('Mood History and Trends', () => {
    it('should display recent mood entries', () => {
      const mockMoods = [
        {
          id: '1',
          userId: 'user1',
          value: MoodValue.Good,
          createdAt: new Date('2025-01-09'),
          updatedAt: new Date('2025-01-09'),
          synced: true,
        },
        {
          id: '2',
          userId: 'user1',
          value: MoodValue.Neutral,
          createdAt: new Date('2025-01-08'),
          updatedAt: new Date('2025-01-08'),
          synced: true,
        },
      ];

      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        recentMoods: mockMoods,
      });

      const { getByTestId } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('mood-history')).toBeTruthy();
      expect(getByTestId('mood-entry-1')).toBeTruthy();
      expect(getByTestId('mood-entry-2')).toBeTruthy();
    });

    it('should display mood trends chart', () => {
      const mockTrend = {
        period: 'week' as const,
        average: 3.5,
        entries: [],
        lowestDay: new Date('2025-01-05'),
        highestDay: new Date('2025-01-09'),
        improvementRate: 15,
      };

      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        trends: { week: mockTrend },
      });

      const { getByTestId, getByText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('mood-trends-chart')).toBeTruthy();
      expect(getByText('15% improvement')).toBeTruthy();
    });

    it('should show mood streak', () => {
      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        streakDays: 7,
      });

      const { getByText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('7 day streak!')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for mood options', () => {
      const { getByTestId } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      const veryLowOption = getByTestId('mood-option-1');
      expect(veryLowOption.props.accessibilityLabel).toBe('Select Very Low mood');
      expect(veryLowOption.props.accessibilityRole).toBe('button');
    });

    it('should announce mood selection to screen readers', () => {
      const { getByTestId } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      const goodMoodOption = getByTestId('mood-option-4');
      fireEvent.press(goodMoodOption);

      expect(goodMoodOption.props.accessibilityState.selected).toBe(true);
      expect(goodMoodOption.props.accessibilityHint).toBe('Selected Good mood');
    });

    it('should have accessible crisis resources', () => {
      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        detectCrisisKeywords: jest.fn().mockReturnValue({
          detected: true,
          severity: 'critical',
          matchedKeywords: ['suicide'],
          suggestedActions: ['Contact 988'],
        }),
      });

      const { getByTestId, getByPlaceholderText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-1'));
      
      const noteInput = getByPlaceholderText('What\'s on your mind? (optional)');
      fireEvent.changeText(noteInput, 'suicidal thoughts');

      const crisisButton = getByTestId('crisis-hotline-button');
      expect(crisisButton.props.accessibilityLabel).toBe('Call 988 Suicide and Crisis Lifeline');
      expect(crisisButton.props.accessibilityRole).toBe('button');
      expect(crisisButton.props.accessibilityHint).toBe('Double tap to call crisis hotline');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when mood submission fails', async () => {
      const mockError = 'Failed to save mood entry';
      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        addMoodEntry: jest.fn().mockRejectedValue(new Error(mockError)),
        error: mockError,
      });

      const { getByTestId, getByText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('mood-option-3'));
      fireEvent.press(getByText('Log Mood'));

      await waitFor(() => {
        expect(getByText('Unable to save your mood. Please try again.')).toBeTruthy();
      });
    });

    it('should use empathetic error messages', async () => {
      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        error: 'Network error',
      });

      const { queryByText } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Should not show technical error messages
      expect(queryByText('Network error')).toBeFalsy();
      expect(queryByText('Something went wrong, but we\'re here to help.')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when fetching mood history', () => {
      mockUseWellnessStore.mockReturnValue({
        ...defaultMockStore,
        isLoading: true,
      });

      const { getByTestId } = renderWithProviders(
        <WellnessScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });
});