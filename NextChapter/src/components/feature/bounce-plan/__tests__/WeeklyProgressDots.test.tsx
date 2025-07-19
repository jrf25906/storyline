import React from 'react';
import { render } from '@testing-library/react-native';
import WeeklyProgressDots from '@components/feature/bounce-plan/WeeklyProgressDots';
import { ThemeProvider } from '@context/ThemeContext';

// Mock dependencies
jest.mock('../../../../constants/bouncePlanTasks', () => ({
  BOUNCE_PLAN_TASKS: [
    { id: 'task-1', day: 1, title: 'Task 1' },
    { id: 'task-2', day: 2, title: 'Task 2' },
    { id: 'task-3', day: 3, title: 'Task 3' },
    { id: 'task-4', day: 4, title: 'Task 4' },
    { id: 'task-5', day: 5, title: 'Task 5' },
    { id: 'task-6', day: 6, title: 'Task 6' },
    { id: 'task-7', day: 7, title: 'Task 7' },
    { id: 'task-8', day: 8, title: 'Task 8' },
    { id: 'task-9', day: 9, title: 'Task 9' },
    { id: 'task-10', day: 10, title: 'Task 10' },
    { id: 'task-11', day: 11, title: 'Task 11' },
    { id: 'task-12', day: 12, title: 'Task 12' },
    { id: 'task-13', day: 13, title: 'Task 13' },
    { id: 'task-14', day: 14, title: 'Task 14' },
  ],
}));

// Mock theme
const mockTheme = {
  colors: {
    primary: '#2D5A27',
    background: '#FDFCF8',
    text: '#1D2B1F',
    textSecondary: '#5A6B5D',
    success: '#4CAF50',
    border: '#E0E0E0',
  },
};

const mockDarkTheme = {
  colors: {
    primary: '#4B8545',
    background: '#1A1F1B',
    text: '#F0F2E6',
    textSecondary: '#A0A99E',
    success: '#5CBF60',
    border: '#3D4A3E',
  },
};

jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('WeeklyProgressDots', () => {
  const mockGetTaskStatus = jest.fn();

  const defaultProps = {
    currentDay: 3,
    getTaskStatus: mockGetTaskStatus,
  };

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTaskStatus.mockReturnValue(undefined);
  });

  it('should render weekly progress title', () => {
    const { getByText } = renderWithTheme(
      <WeeklyProgressDots {...defaultProps} />
    );

    expect(getByText('Your Progress This Week')).toBeTruthy();
  });

  it('should render 7 progress dots', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <WeeklyProgressDots {...defaultProps} />
    );

    const View = require('react-native').View;
    const views = UNSAFE_getAllByType(View);
    
    // Find dots by their style properties
    const dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8 &&
      view.props.style[0].height === 8
    );
    
    expect(dots).toHaveLength(7);
  });

  it('should highlight current day with primary color', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <WeeklyProgressDots {...defaultProps} />
    );

    const View = require('react-native').View;
    const views = UNSAFE_getAllByType(View);
    
    const dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8
    );

    // Third dot (index 2) should be today
    expect(dots[2].props.style[1].backgroundColor).toBe(mockTheme.colors.primary);
  });

  it('should show completed tasks with success color', () => {
    mockGetTaskStatus.mockImplementation((taskId) => {
      if (taskId === 'task-1' || taskId === 'task-2') {
        return { completed: true };
      }
      return undefined;
    });

    const { UNSAFE_getAllByType } = renderWithTheme(
      <WeeklyProgressDots {...defaultProps} />
    );

    const View = require('react-native').View;
    const views = UNSAFE_getAllByType(View);
    
    const dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8
    );

    // First two dots should be completed (success color)
    expect(dots[0].props.style[1].backgroundColor).toBe(mockTheme.colors.success);
    expect(dots[1].props.style[1].backgroundColor).toBe(mockTheme.colors.success);
  });

  it('should show future days with reduced opacity', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(
      <WeeklyProgressDots currentDay={3} getTaskStatus={mockGetTaskStatus} />
    );

    const View = require('react-native').View;
    const views = UNSAFE_getAllByType(View);
    
    const dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8
    );

    // Days 4-7 (indices 3-6) should have reduced opacity
    for (let i = 3; i < 7; i++) {
      expect(dots[i].props.style[1].opacity).toBe(0.3);
    }
  });

  it('should calculate correct week for different current days', () => {
    // Test week 2 (days 8-14)
    const { rerender, UNSAFE_getAllByType } = renderWithTheme(
      <WeeklyProgressDots currentDay={10} getTaskStatus={mockGetTaskStatus} />
    );

    const View = require('react-native').View;
    let views = UNSAFE_getAllByType(View);
    
    let dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8
    );

    // Check accessibility labels for week 2
    expect(dots[0].props.accessibilityLabel).toBe('Day 8: not completed');
    expect(dots[1].props.accessibilityLabel).toBe('Day 9: not completed');
    expect(dots[2].props.accessibilityLabel).toBe('Day 10: today');
  });

  it('should display correct completion count', () => {
    mockGetTaskStatus.mockImplementation((taskId) => {
      if (['task-1', 'task-2', 'task-3'].includes(taskId)) {
        return { completed: true };
      }
      return undefined;
    });

    const { getByText } = renderWithTheme(
      <WeeklyProgressDots currentDay={5} getTaskStatus={mockGetTaskStatus} />
    );

    expect(getByText('3 of 7 tasks completed this week')).toBeTruthy();
  });

  it('should handle no completed tasks', () => {
    const { getByText } = renderWithTheme(
      <WeeklyProgressDots {...defaultProps} />
    );

    expect(getByText('0 of 7 tasks completed this week')).toBeTruthy();
  });

  it('should handle all tasks completed', () => {
    mockGetTaskStatus.mockReturnValue({ completed: true });

    const { getByText } = renderWithTheme(
      <WeeklyProgressDots currentDay={7} getTaskStatus={mockGetTaskStatus} />
    );

    expect(getByText('7 of 7 tasks completed this week')).toBeTruthy();
  });

  it('should apply dark theme colors', () => {
    const useThemeMock = require('../../../../context/ThemeContext').useTheme;
    useThemeMock.mockReturnValue({
      theme: mockDarkTheme,
      isDark: true,
    });

    const { getByText } = renderWithTheme(
      <WeeklyProgressDots {...defaultProps} />
    );

    const title = getByText('Your Progress This Week');
    expect(title.props.style[1].color).toBe(mockDarkTheme.colors.text);

    const stats = getByText('0 of 7 tasks completed this week');
    expect(stats.props.style[1].color).toBe(mockDarkTheme.colors.textSecondary);
  });

  it('should provide correct accessibility labels', () => {
    mockGetTaskStatus.mockImplementation((taskId) => {
      if (taskId === 'task-1') return { completed: true };
      return undefined;
    });

    const { UNSAFE_getAllByType } = renderWithTheme(
      <WeeklyProgressDots currentDay={3} getTaskStatus={mockGetTaskStatus} />
    );

    const View = require('react-native').View;
    const views = UNSAFE_getAllByType(View);
    
    const dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8
    );

    expect(dots[0].props.accessibilityLabel).toBe('Day 1: completed');
    expect(dots[1].props.accessibilityLabel).toBe('Day 2: not completed');
    expect(dots[2].props.accessibilityLabel).toBe('Day 3: today');
    expect(dots[3].props.accessibilityLabel).toBe('Day 4: upcoming');
  });

  it('should handle skipped tasks', () => {
    mockGetTaskStatus.mockImplementation((taskId) => {
      if (taskId === 'task-1') return { skipped: true };
      return undefined;
    });

    const { UNSAFE_getAllByType } = renderWithTheme(
      <WeeklyProgressDots {...defaultProps} />
    );

    const View = require('react-native').View;
    const views = UNSAFE_getAllByType(View);
    
    const dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8
    );

    // Skipped tasks should not be marked as completed
    expect(dots[0].props.style[1].backgroundColor).toBe(mockTheme.colors.border);
  });

  it('should handle missing tasks gracefully', () => {
    mockGetTaskStatus.mockReturnValue(undefined);

    const { getByText } = renderWithTheme(
      <WeeklyProgressDots currentDay={15} getTaskStatus={mockGetTaskStatus} />
    );

    // Should still render without crashing
    expect(getByText('Your Progress This Week')).toBeTruthy();
    expect(getByText('0 of 7 tasks completed this week')).toBeTruthy();
  });

  it('should correctly calculate week boundaries', () => {
    // Day 7 should show week 1 (days 1-7)
    const { rerender, UNSAFE_getAllByType } = renderWithTheme(
      <WeeklyProgressDots currentDay={7} getTaskStatus={mockGetTaskStatus} />
    );

    const View = require('react-native').View;
    let views = UNSAFE_getAllByType(View);
    let dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8
    );

    expect(dots[6].props.accessibilityLabel).toBe('Day 7: today');

    // Day 8 should show week 2 (days 8-14)
    rerender(
      <ThemeProvider>
        <WeeklyProgressDots currentDay={8} getTaskStatus={mockGetTaskStatus} />
      </ThemeProvider>
    );

    views = UNSAFE_getAllByType(View);
    dots = views.filter(view => 
      view.props.style && 
      Array.isArray(view.props.style) &&
      view.props.style[0] &&
      view.props.style[0].width === 8
    );

    expect(dots[0].props.accessibilityLabel).toBe('Day 8: today');
  });
});