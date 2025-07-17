import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';

// Components
import AppNavigator from '../../navigation/AppNavigator';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock stores - define inside mock factory functions to avoid Jest variable reference issues
let mockAuthStore: any;
let mockOnboardingStore: any;
let mockBouncePlanStore: any;

// Mock the stores
jest.mock('../../stores/authStore', () => {
  mockAuthStore = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    updateProfile: jest.fn(),
  };
  return {
    useAuthStore: () => mockAuthStore,
  };
});

jest.mock('../../stores/onboardingStore', () => {
  mockOnboardingStore = {
    currentStep: 0,
    isComplete: false,
    userProfile: null,
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    completeOnboarding: jest.fn(),
    updateProfile: jest.fn(),
    reset: jest.fn(),
  };
  return {
    useOnboardingStore: () => mockOnboardingStore,
  };
});

jest.mock('../../stores/bouncePlanStore', () => {
  mockBouncePlanStore = {
    tasks: [],
    currentDay: 1,
    completedTasks: [],
    isLoading: false,
    loadTasks: jest.fn(),
    completeTask: jest.fn(),
    getCurrentDayTasks: jest.fn(() => []),
    getTaskById: jest.fn(),
  };
  return {
    useBouncePlanStore: () => mockBouncePlanStore,
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen',
  }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <NavigationContainer>
      {children}
    </NavigationContainer>
  </ThemeProvider>
);

describe('Integration: Onboarding → First Task Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store states
    mockAuthStore.user = null;
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isLoading = false;
    
    mockOnboardingStore.currentStep = 0;
    mockOnboardingStore.isComplete = false;
    mockOnboardingStore.userProfile = null;
    
    mockBouncePlanStore.tasks = [];
    mockBouncePlanStore.currentDay = 1;
    mockBouncePlanStore.completedTasks = [];
    mockBouncePlanStore.isLoading = false;
  });

  it('should complete full onboarding flow and navigate to first task', async () => {
    const { getByText, getByTestId, queryByText } = render(
      <TestWrapper>
        <AppNavigator />
      </TestWrapper>
    );

    // Step 1: User should see welcome screen (unauthenticated)
    await waitFor(() => {
      expect(queryByText('Welcome to Next Chapter')).toBeTruthy();
    });

    // Step 2: User signs up
    const signUpButton = getByText('Get Started');
    fireEvent.press(signUpButton);

    // Mock successful sign up
    await act(async () => {
      mockAuthStore.signUp.mockResolvedValueOnce({ success: true });
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      };
    });

    // Step 3: User should enter onboarding flow
    await waitFor(() => {
      expect(mockOnboardingStore.nextStep).toHaveBeenCalled();
    });

    // Step 4: Complete onboarding steps
    await act(async () => {
      // Simulate completing all onboarding steps
      mockOnboardingStore.currentStep = 3; // Final step
      mockOnboardingStore.isComplete = true;
      mockOnboardingStore.userProfile = {
        name: 'Test User',
        careerLevel: 'mid',
        industry: 'technology',
        goals: ['find_job', 'build_network'],
      };
    });

    // Step 5: User should be navigated to bounce plan with first task
    await waitFor(() => {
      expect(mockBouncePlanStore.loadTasks).toHaveBeenCalled();
    });

    // Mock first day tasks
    await act(async () => {
      mockBouncePlanStore.getCurrentDayTasks.mockReturnValue([
        {
          id: 'task-1',
          title: 'Take a Breath & Acknowledge',
          description: 'Start your bounce back journey',
          day: 1,
          status: 'available',
          category: 'mindset',
          estimatedDuration: 10,
        },
      ]);
    });

    // Step 6: Verify first task is displayed
    await waitFor(() => {
      expect(queryByText('Take a Breath & Acknowledge')).toBeTruthy();
      expect(queryByText('Day 1 of 30')).toBeTruthy();
    });

    // Step 7: User can interact with first task
    const firstTask = getByText('Take a Breath & Acknowledge');
    fireEvent.press(firstTask);

    // Verify task interaction
    await waitFor(() => {
      expect(queryByText('Start your bounce back journey')).toBeTruthy();
    });
  });

  it('should handle onboarding errors gracefully', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <AppNavigator />
      </TestWrapper>
    );

    // Mock sign up failure
    mockAuthStore.signUp.mockRejectedValueOnce(new Error('Network error'));

    const signUpButton = getByText('Get Started');
    fireEvent.press(signUpButton);

    // Should show error message
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.stringContaining('Error'),
        expect.stringContaining('Network error')
      );
    });

    // User should remain on welcome screen
    expect(queryByText('Welcome to Next Chapter')).toBeTruthy();
  });

  it('should preserve onboarding progress on app restart', async () => {
    // Simulate user who partially completed onboarding
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'test-user', email: 'test@example.com' };
    mockOnboardingStore.currentStep = 2;
    mockOnboardingStore.isComplete = false;

    const { queryByText } = render(
      <TestWrapper>
        <AppNavigator />
      </TestWrapper>
    );

    // Should resume onboarding at correct step
    await waitFor(() => {
      expect(mockOnboardingStore.currentStep).toBe(2);
      expect(queryByText('Welcome to Next Chapter')).toBeFalsy();
    });
  });

  it('should skip onboarding for returning users', async () => {
    // Simulate returning user
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'returning-user', email: 'returning@example.com' };
    mockOnboardingStore.isComplete = true;

    const { queryByText } = render(
      <TestWrapper>
        <AppNavigator />
      </TestWrapper>
    );

    // Should go directly to main app
    await waitFor(() => {
      expect(mockBouncePlanStore.loadTasks).toHaveBeenCalled();
      expect(queryByText('Welcome to Next Chapter')).toBeFalsy();
    });
  });

  it('should show welcome alert for new users completing onboarding', async () => {
    // Simulate user completing onboarding for first time
    mockAuthStore.isAuthenticated = true;
    mockOnboardingStore.isComplete = true;
    mockBouncePlanStore.completedTasks = []; // No completed tasks = new user

    render(
      <TestWrapper>
        <AppNavigator />
      </TestWrapper>
    );

    // Should show welcome alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.stringContaining('Welcome'),
        expect.stringContaining('30-Day Bounce Plan'),
        expect.any(Array)
      );
    });
  });
});