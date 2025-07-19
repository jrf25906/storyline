import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '@screens/main/HomeScreen';
import { useBouncePlanStore } from '@stores/bouncePlanStore';
import { useBudgetStore } from '@stores/budgetStore';
import { useWellnessStore } from '@stores/wellnessStore';
import { useJobTrackerStore } from '@stores/jobTrackerStore';
import { useAuth } from '@hooks/useAuth';
import { ThemeProvider } from '@context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Mock stores
jest.mock('../../../stores/bouncePlanStore');
jest.mock('../../../stores/budgetStore');
jest.mock('../../../stores/wellnessStore');
jest.mock('../../../stores/jobTrackerStore');
jest.mock('../../../hooks/useAuth');

const Stack = createNativeStackNavigator();

const MockHomeScreen = () => <HomeScreen />;

const renderWithProviders = () => {
  return render(
    <NavigationContainer>
      <ThemeProvider>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={MockHomeScreen} />
        </Stack.Navigator>
      </ThemeProvider>
    </NavigationContainer>
  );
};

describe('HomeScreen', () => {
  const mockBouncePlanStore = {
    startDate: new Date('2025-01-01'),
    getCurrentDay: jest.fn().mockReturnValue(5),
    getTaskStatus: jest.fn().mockReturnValue('available'),
    completedTasks: new Set(['task-1', 'task-2']),
    isLoading: false,
  };

  const mockBudgetStore = {
    runway: {
      totalMonths: 4.5,
      monthlyBurn: 3500,
      totalFunds: 15750,
      runwayEndDate: new Date('2025-05-15'),
    },
    alerts: [
      { id: '1', type: 'warning', message: 'Runway below 6 months', severity: 'medium', dismissed: false },
    ],
    isLoading: false,
  };

  const mockWellnessStore = {
    currentMood: {
      id: '1',
      value: 3,
      note: 'Feeling okay',
      createdAt: new Date(),
    },
    lastCheckInDate: new Date(),
    streakDays: 5,
    isLoading: false,
    addMoodEntry: jest.fn(),
  };

  const mockJobTrackerStore = {
    applications: [
      { id: '1', status: 'applied' },
      { id: '2', status: 'applied' },
      { id: '3', status: 'interviewing' },
      { id: '4', status: 'offer' },
    ],
    isLoading: false,
  };

  const mockAuth = {
    user: {
      id: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useBouncePlanStore as unknown as jest.Mock).mockReturnValue(mockBouncePlanStore);
    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockBudgetStore);
    (useWellnessStore as unknown as jest.Mock).mockReturnValue(mockWellnessStore);
    (useJobTrackerStore as unknown as jest.Mock).mockReturnValue(mockJobTrackerStore);
    (useAuth as unknown as jest.Mock).mockReturnValue(mockAuth);
  });

  describe('Header Section', () => {
    it('should display personalized greeting with user name', () => {
      const { getByText } = renderWithProviders();
      expect(getByText(/Good \w+, Test/)).toBeTruthy();
    });

    it('should display appropriate time-based greeting', () => {
      const { getByText } = renderWithProviders();
      // Should show either "Good morning", "Good afternoon", or "Good evening"
      expect(getByText(/Good (morning|afternoon|evening), Test/)).toBeTruthy();
    });

    it('should display current date', () => {
      const { getByText } = renderWithProviders();
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      expect(getByText(today)).toBeTruthy();
    });
  });

  describe('Daily Bounce Plan Section', () => {
    it('should display current day progress', () => {
      const { getAllByText } = renderWithProviders();
      const dayProgress = getAllByText('Day 5 of 30');
      expect(dayProgress.length).toBeGreaterThan(0);
    });

    it('should display today\'s task preview', () => {
      const { getByText } = renderWithProviders();
      expect(getByText(/Today's Task/)).toBeTruthy();
    });

    it('should show task completion status', () => {
      const { getByText } = renderWithProviders();
      expect(getByText('2 tasks completed')).toBeTruthy();
    });

    it('should have accessible touch target for navigation', () => {
      const { getByTestId } = renderWithProviders();
      const bouncePlanCard = getByTestId('bounce-plan-card');
      expect(bouncePlanCard).toBeTruthy();
    });
  });

  describe('Budget Runway Section', () => {
    it('should display runway in months', () => {
      const { getByText } = renderWithProviders();
      expect(getByText('4.5 months')).toBeTruthy();
    });

    it('should show runway indicator visualization', () => {
      const { getByTestId } = renderWithProviders();
      expect(getByTestId('runway-indicator')).toBeTruthy();
    });

    it('should display active alerts count', () => {
      const { getByText } = renderWithProviders();
      expect(getByText('1 alert')).toBeTruthy();
    });

    it('should not display detailed financial information', () => {
      const { queryByText } = renderWithProviders();
      expect(queryByText('$15,750')).toBeNull();
      expect(queryByText('$3,500')).toBeNull();
    });
  });

  describe('Mood Check-in Section', () => {
    it('should display mood check-in prompt when not checked in today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const mockStoreNoMoodToday = {
        ...mockWellnessStore,
        lastCheckInDate: yesterday,
      };
      (useWellnessStore as unknown as jest.Mock).mockReturnValue(mockStoreNoMoodToday);
      
      const { getByText } = renderWithProviders();
      expect(getByText(/How are you feeling today/)).toBeTruthy();
    });

    it('should display mood streak when checked in', () => {
      const { getByText } = renderWithProviders();
      expect(getByText('5 day streak')).toBeTruthy();
    });

    it('should show mood emoji for current mood', () => {
      const { getByTestId } = renderWithProviders();
      expect(getByTestId('mood-emoji')).toBeTruthy();
    });
  });

  describe('Job Applications Section', () => {
    it('should display pipeline summary', () => {
      const { getByText } = renderWithProviders();
      expect(getByText('4 active applications')).toBeTruthy();
    });

    it('should show applications by status', () => {
      const { getByText } = renderWithProviders();
      expect(getByText('2 Applied')).toBeTruthy();
      expect(getByText('1 Interviewing')).toBeTruthy();
      expect(getByText('1 Offer')).toBeTruthy();
    });

    it('should have accessible navigation to tracker', () => {
      const { getByTestId } = renderWithProviders();
      expect(getByTestId('job-tracker-card')).toBeTruthy();
    });
  });

  describe('Quick Actions Section', () => {
    it('should display AI Coach quick access button', () => {
      const { getByText } = renderWithProviders();
      expect(getByText('Talk to Coach')).toBeTruthy();
    });

    it('should show coach button with large touch target', () => {
      const { getByTestId } = renderWithProviders();
      const coachButton = getByTestId('coach-quick-action');
      expect(coachButton).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should show skeleton loaders when data is loading', () => {
      const loadingStores = {
        bouncePlanStore: { ...mockBouncePlanStore, isLoading: true },
        budgetStore: { ...mockBudgetStore, isLoading: true },
        wellnessStore: { ...mockWellnessStore, isLoading: true },
        jobTrackerStore: { ...mockJobTrackerStore, isLoading: true },
      };

      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue(loadingStores.bouncePlanStore);
      (useBudgetStore as unknown as jest.Mock).mockReturnValue(loadingStores.budgetStore);
      (useWellnessStore as unknown as jest.Mock).mockReturnValue(loadingStores.wellnessStore);
      (useJobTrackerStore as unknown as jest.Mock).mockReturnValue(loadingStores.jobTrackerStore);

      const { getAllByTestId } = renderWithProviders();
      const skeletons = getAllByTestId(/skeleton-loader/);
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = renderWithProviders();
      expect(getByLabelText('Navigate to Bounce Plan')).toBeTruthy();
      expect(getByLabelText('View Budget Details')).toBeTruthy();
      expect(getByLabelText('Log your mood')).toBeTruthy();
      expect(getByLabelText('View Job Applications')).toBeTruthy();
      expect(getByLabelText('Talk to AI Coach')).toBeTruthy();
    });

    it('should announce screen content to screen readers', () => {
      const { getByTestId } = renderWithProviders();
      const mainContainer = getByTestId('home-screen-container');
      expect(mainContainer.props.accessible).toBe(true);
    });
  });

  describe('Error States', () => {
    it('should handle missing user gracefully', () => {
      (useAuth as unknown as jest.Mock).mockReturnValue({ user: null });
      const { getByText } = renderWithProviders();
      expect(getByText(/Good \w+, there/)).toBeTruthy();
    });

    it('should handle missing data gracefully', () => {
      (useBouncePlanStore as unknown as jest.Mock).mockReturnValue({
        ...mockBouncePlanStore,
        startDate: null,
      });
      
      const { getByText } = renderWithProviders();
      expect(getByText('Start your journey')).toBeTruthy();
    });
  });

  describe('Progressive Disclosure', () => {
    it('should not show advanced features on first view', () => {
      const { queryByText } = renderWithProviders();
      expect(queryByText('Resume Scanner')).toBeNull();
      expect(queryByText('Peer Connect')).toBeNull();
    });

    it('should show essential features prominently', () => {
      const { getByTestId } = renderWithProviders();
      expect(getByTestId('bounce-plan-card')).toBeTruthy();
      expect(getByTestId('budget-card')).toBeTruthy();
      expect(getByTestId('mood-card')).toBeTruthy();
      expect(getByTestId('job-tracker-card')).toBeTruthy();
    });
  });
});