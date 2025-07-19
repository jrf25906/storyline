import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Components
import BouncePlanScreen from '@screens/main/BouncePlanScreen';
import TaskDetailsScreen from '@screens/bounce-plan/TaskDetailsScreen';
import { ThemeProvider } from '@context/ThemeContext';
import { EmotionalStateProvider } from '@context/EmotionalStateContext';

// Mock stores - create fresh instances for each test
const createMockBouncePlanStore = () => ({
  tasks: [
    {
      id: 'task-1',
      title: 'Take a Breath & Acknowledge',
      description: 'Start your bounce back journey with mindful acknowledgment',
      day: 1,
      status: 'available',
      category: 'mindset',
      estimatedDuration: 10,
      instructions: 'Take 5 deep breaths and acknowledge your current situation',
    },
    {
      id: 'task-2',
      title: 'Quick Financial Health Check',
      description: 'Assess your current financial situation',
      day: 3,
      status: 'locked',
      category: 'financial',
      estimatedDuration: 15,
    },
  ],
  currentDay: 1,
  completedTasks: [],
  progress: {
    totalTasks: 22,
    completedCount: 0,
    currentWeek: 1,
    percentComplete: 0,
  },
  isLoading: false,
  completeTask: jest.fn(),
  skipTask: jest.fn(),
  reopenTask: jest.fn(),
  loadTasks: jest.fn(),
  getCurrentDayTasks: jest.fn(),
  getTaskById: jest.fn(),
  updateProgress: jest.fn(),
  getCompletedTasksCount: jest.fn(() => 0),
  initialize: jest.fn(),
  resetProgress: jest.fn(),
  getTaskStatus: jest.fn(() => ({ completed: false, skipped: false })),
});

const createMockMoodStore = () => ({
  entries: [],
  addEntry: jest.fn(),
  getRecentTrend: jest.fn(() => 'stable'),
});

let mockBouncePlanStore = createMockBouncePlanStore();
let mockMoodStore = createMockMoodStore();

const mockEmotionalState = {
  currentState: 'normal',
  setState: jest.fn(),
  triggerCelebration: jest.fn(),
  showCrisisSupport: jest.fn(),
};

// Mock the stores
jest.mock('../../stores/bouncePlanStore', () => ({
  useBouncePlanStore: () => mockBouncePlanStore,
}));

jest.mock('../../stores/moodStore', () => ({
  useMoodStore: () => mockMoodStore,
}));

// Mock auth store
jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: { taskId: 'task-1' },
    name: 'TaskDetail',
  }),
}));

// Mock auth context
const mockAuth = {
  user: { id: 'test-user', email: 'test@example.com' },
  isAuthenticated: true,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  resendVerificationEmail: jest.fn(),
  refreshSession: jest.fn(),
  checkEmailVerification: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock offline context
const mockOffline = {
  isConnected: true,
  isOnline: true,
  syncQueue: [],
  addToQueue: jest.fn(),
  processSyncQueue: jest.fn(),
  clearQueue: jest.fn(),
};

jest.mock('../../context/OfflineContext', () => ({
  useOffline: () => mockOffline,
  OfflineProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <EmotionalStateProvider value={mockEmotionalState}>
      {children}
    </EmotionalStateProvider>
  </ThemeProvider>
);

describe('Integration: Task Completion → Progress Update Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store states with fresh instances
    mockBouncePlanStore = createMockBouncePlanStore();
    mockMoodStore = createMockMoodStore();
    
    // Setup default mock implementations
    mockBouncePlanStore.getCurrentDayTasks.mockReturnValue([mockBouncePlanStore.tasks[0]]);
    mockBouncePlanStore.getTaskById.mockImplementation((id) => 
      mockBouncePlanStore.tasks.find(task => task.id === id)
    );
  });

  it('should complete full task completion flow with progress updates', async () => {
    // Step 1: Render BouncePlanScreen with available task
    const { getByText, queryByText, rerender } = render(
      <TestWrapper>
        <BouncePlanScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Take a Breath & Acknowledge')).toBeTruthy();
      expect(getByText('Day 1 of 30 • 0% Complete')).toBeTruthy();
    });

    // Step 2: User taps on task to open detail screen
    const taskCard = getByText('Take a Breath & Acknowledge');
    fireEvent.press(taskCard);

    // Step 3: Render TaskDetailsScreen
    const mockNavigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      dispatch: jest.fn(),
    };
    const mockRoute = {
      params: { taskId: 'task-1' },
      name: 'TaskDetail',
    };
    
    rerender(
      <TestWrapper>
        <TaskDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText('Start your bounce back journey with mindful acknowledgment')).toBeTruthy();
      expect(getByText('Start Task')).toBeTruthy();
    });

    // Step 4: User starts the task
    const startButton = getByText('Start Task');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(getByText('Take 5 deep breaths and acknowledge your current situation')).toBeTruthy();
      expect(getByText('Complete Task')).toBeTruthy();
    });

    // Step 5: User completes the task
    const completeButton = getByText('Complete Task');
    
    await act(async () => {
      // Mock successful task completion
      mockBouncePlanStore.completeTask.mockResolvedValueOnce({
        success: true,
        taskId: 'task-1',
        completedAt: new Date().toISOString(),
      });
      
      fireEvent.press(completeButton);
    });

    // Step 6: Verify task completion was called
    await waitFor(() => {
      expect(mockBouncePlanStore.completeTask).toHaveBeenCalledWith('task-1', {
        notes: undefined,
        completedAt: expect.any(String),
      });
    });

    // Step 7: Mock updated store state after completion
    await act(async () => {
      mockBouncePlanStore.completedTasks = ['task-1'];
      mockBouncePlanStore.progress = {
        totalTasks: 22,
        completedCount: 1,
        currentWeek: 1,
        percentComplete: 5, // 1/22 ≈ 4.5% rounded to 5%
      };
      mockBouncePlanStore.updateProgress.mockReturnValue({
        totalTasks: 22,
        completedCount: 1,
        percentComplete: 5,
      });
    });

    // Step 8: Verify celebration is triggered
    await waitFor(() => {
      expect(mockEmotionalState.triggerCelebration).toHaveBeenCalledWith({
        type: 'task_completion',
        taskId: 'task-1',
        message: expect.stringContaining('Great job'),
      });
    });

    // Step 9: Navigate back to BouncePlanScreen
    rerender(
      <TestWrapper>
        <BouncePlanScreen />
      </TestWrapper>
    );

    // Step 10: Verify progress is updated
    await waitFor(() => {
      expect(queryByText('Day 1 of 30 • 5% Complete')).toBeTruthy();
      expect(queryByText('Completed')).toBeTruthy(); // Task should show as completed
    });

    // Step 11: Verify next task is unlocked if applicable
    const nextDayTasks = mockBouncePlanStore.tasks.filter(task => task.day === 2);
    if (nextDayTasks.length > 0) {
      expect(mockBouncePlanStore.updateProgress).toHaveBeenCalled();
    }
  });

  it('should handle task completion with notes', async () => {
    const mockNavigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      dispatch: jest.fn(),
    };
    const mockRoute = {
      params: { taskId: 'task-1' },
      name: 'TaskDetail',
    };

    const { getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <TaskDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    // User adds notes before completing
    const notesInput = getByPlaceholderText('Add notes about your experience...');
    fireEvent.changeText(notesInput, 'This task helped me feel more grounded and focused.');

    const completeButton = getByText('Complete Task');
    
    await act(async () => {
      mockBouncePlanStore.completeTask.mockResolvedValueOnce({ success: true });
      fireEvent.press(completeButton);
    });

    // Verify notes are included in completion
    await waitFor(() => {
      expect(mockBouncePlanStore.completeTask).toHaveBeenCalledWith('task-1', {
        notes: 'This task helped me feel more grounded and focused.',
        completedAt: expect.any(String),
      });
    });
  });

  it('should handle task skip flow', async () => {
    const mockNavigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      dispatch: jest.fn(),
    };
    const mockRoute = {
      params: { taskId: 'task-1' },
      name: 'TaskDetail',
    };

    const { getByText } = render(
      <TestWrapper>
        <TaskDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    // User chooses to skip task
    const skipButton = getByText('Skip for Now');
    
    await act(async () => {
      mockBouncePlanStore.skipTask.mockResolvedValueOnce({ success: true });
      fireEvent.press(skipButton);
    });

    // Should show skip confirmation
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Skip Task',
        expect.stringContaining('Are you sure'),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Skip' }),
        ])
      );
    });

    // Simulate user confirming skip
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const skipConfirmButton = alertCall[2].find((button: any) => button.text === 'Skip');
    
    await act(async () => {
      skipConfirmButton.onPress();
    });

    // Verify skip was called
    await waitFor(() => {
      expect(mockBouncePlanStore.skipTask).toHaveBeenCalledWith('task-1');
    });
  });

  it('should handle task completion errors gracefully', async () => {
    const mockNavigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      dispatch: jest.fn(),
    };
    const mockRoute = {
      params: { taskId: 'task-1' },
      name: 'TaskDetail',
    };

    const { getByText } = render(
      <TestWrapper>
        <TaskDetailsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    const completeButton = getByText('Complete Task');
    
    await act(async () => {
      // Mock completion failure
      mockBouncePlanStore.completeTask.mockRejectedValueOnce(
        new Error('Network error - please try again')
      );
      fireEvent.press(completeButton);
    });

    // Should show error alert
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        expect.stringContaining('Network error'),
        expect.any(Array)
      );
    });

    // Task should remain incomplete
    expect(mockBouncePlanStore.completedTasks).not.toContain('task-1');
  });

  it('should update weekly progress correctly', async () => {
    // Mock completing multiple tasks to trigger weekly progress
    await act(async () => {
      mockBouncePlanStore.completedTasks = ['task-1', 'task-2', 'task-3'];
      mockBouncePlanStore.progress = {
        totalTasks: 22,
        completedCount: 3,
        currentWeek: 1,
        percentComplete: 14, // 3/22 ≈ 13.6% rounded to 14%
      };
    });

    const { getByText } = render(
      <TestWrapper>
        <BouncePlanScreen />
      </TestWrapper>
    );

    // Should show updated progress
    await waitFor(() => {
      expect(getByText('Day 1 of 30 • 14% Complete')).toBeTruthy();
    });

    // Should show week progress
    expect(mockBouncePlanStore.updateProgress).toHaveBeenCalled();
  });

  it('should trigger milestone celebrations', async () => {
    // Mock completing first week (5 tasks)
    await act(async () => {
      mockBouncePlanStore.completedTasks = ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'];
      mockBouncePlanStore.progress = {
        totalTasks: 22,
        completedCount: 5,
        currentWeek: 1,
        percentComplete: 23,
      };
    });

    const { getByText } = render(
      <TestWrapper>
        <BouncePlanScreen />
      </TestWrapper>
    );

    // Should trigger milestone celebration
    await waitFor(() => {
      expect(mockEmotionalState.triggerCelebration).toHaveBeenCalledWith({
        type: 'milestone',
        milestone: 'first_week',
        message: expect.stringContaining('first week'),
      });
    });
  });
});