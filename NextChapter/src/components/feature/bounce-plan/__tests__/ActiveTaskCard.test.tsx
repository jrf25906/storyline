import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActiveTaskCard from '@components/feature/bounce-plan/ActiveTaskCard';
import { ThemeProvider } from '@context/ThemeContext';
import { BouncePlanTaskDefinition } from '@constants/bouncePlanTasks';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../../common/Card', () => {
  const { View } = require('react-native');
  return ({ children, ...props }: any) => <View {...props}>{children}</View>;
});

// Mock theme
jest.mock('../../../../theme', () => ({
  Colors: {
    primary: '#2D5A27',
    text: '#1D2B1F',
    textSecondary: '#5A6B5D',
    border: '#E8EDE9',
    white: '#FFFFFF',
  },
  Typography: {
    fontSizes: {
      body: 16,
      bodySM: 14,
      headingMD: 20,
    },
    fontWeights: {
      medium: '500',
      semiBold: '600',
    },
  },
  Spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
  },
  Borders: {
    radius: {
      sm: 4,
      md: 8,
    },
  },
}));

const mockTheme = {
  colors: {
    primary: '#2D5A27',
    text: '#1D2B1F',
    textSecondary: '#5A6B5D',
    border: '#E8EDE9',
  },
};

jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ActiveTaskCard', () => {
  const mockTask: BouncePlanTaskDefinition = {
    id: 'test-task-1',
    day: 1,
    title: 'Update Your Resume',
    description: 'Review and refresh your resume with recent accomplishments',
    duration: '30 min',
    category: 'job-search',
    keyObjectives: ['Update work history', 'Add recent achievements'],
    talkingPoints: ['Focus on quantifiable results'],
    milestones: [],
  };

  const mockProps = {
    task: mockTask,
    onStartTask: jest.fn(),
    onSkipTask: jest.fn(),
    onAskCoach: jest.fn(),
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
  });

  it('should render task information correctly', () => {
    const { getByText } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    expect(getByText('Update Your Resume')).toBeTruthy();
    expect(getByText('Review and refresh your resume with recent accomplishments')).toBeTruthy();
    expect(getByText('30 min')).toBeTruthy();
  });

  it('should display action buttons', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    expect(getByText('Start Task')).toBeTruthy();
    expect(getByText('Ask Coach')).toBeTruthy();
    expect(getByText('Skip')).toBeTruthy();
    
    expect(getByLabelText('Start task')).toBeTruthy();
    expect(getByLabelText('Ask coach for help')).toBeTruthy();
    expect(getByLabelText('Skip this task')).toBeTruthy();
  });

  it('should handle start task action', () => {
    const { getByText } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    fireEvent.press(getByText('Start Task'));
    expect(mockProps.onStartTask).toHaveBeenCalledTimes(1);
  });

  it('should handle skip task action', () => {
    const { getByText } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    fireEvent.press(getByText('Skip'));
    expect(mockProps.onSkipTask).toHaveBeenCalledTimes(1);
  });

  it('should handle ask coach action', () => {
    const { getByText } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    fireEvent.press(getByText('Ask Coach'));
    expect(mockProps.onAskCoach).toHaveBeenCalledTimes(1);
  });

  it('should display duration with time icon', () => {
    const { getByText, UNSAFE_getByProps } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    expect(getByText('30 min')).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'time-outline' })).toBeTruthy();
  });

  it('should apply theme colors correctly', () => {
    const { getByText } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    const title = getByText('Update Your Resume');
    expect(title.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#1D2B1F' }) // theme.colors.text
      ])
    );

    const description = getByText('Review and refresh your resume with recent accomplishments');
    expect(description.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#5A6B5D' }) // theme.colors.textSecondary
      ])
    );
  });

  it('should have proper accessibility roles for buttons', () => {
    const { getByLabelText } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    const startButton = getByLabelText('Start task');
    expect(startButton.props.accessibilityRole).toBe('button');

    const coachButton = getByLabelText('Ask coach for help');
    expect(coachButton.props.accessibilityRole).toBe('button');
  });

  it('should display coach button with icon', () => {
    const { getByText, UNSAFE_getByProps } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    expect(getByText('Ask Coach')).toBeTruthy();
    expect(UNSAFE_getByProps({ name: 'chatbubble-outline' })).toBeTruthy();
  });

  it('should apply card props correctly', () => {
    const { UNSAFE_getByProps } = renderWithTheme(
      <ActiveTaskCard {...mockProps} />
    );

    const card = UNSAFE_getByProps({ variant: 'task' });
    expect(card).toBeTruthy();
    expect(card.props.shadow).toBe(true);
    expect(card.props.hoverable).toBe(true);
    expect(card.props.animatePress).toBe(true);
  });

  it('should render with different task durations', () => {
    const shortTask = { ...mockTask, duration: '10 min' };
    const { getByText, rerender } = renderWithTheme(
      <ActiveTaskCard {...mockProps} task={shortTask} />
    );

    expect(getByText('10 min')).toBeTruthy();

    const longTask = { ...mockTask, duration: '1 hour' };
    rerender(
      <ThemeProvider>
        <ActiveTaskCard {...mockProps} task={longTask} />
      </ThemeProvider>
    );

    expect(getByText('1 hour')).toBeTruthy();
  });

  it('should handle tasks with different categories', () => {
    const wellnessTask = {
      ...mockTask,
      category: 'wellness' as const,
      title: 'Morning Meditation',
    };

    const { getByText } = renderWithTheme(
      <ActiveTaskCard {...mockProps} task={wellnessTask} />
    );

    expect(getByText('Morning Meditation')).toBeTruthy();
  });

  it('should not call any action when card is just rendered', () => {
    renderWithTheme(<ActiveTaskCard {...mockProps} />);

    expect(mockProps.onStartTask).not.toHaveBeenCalled();
    expect(mockProps.onSkipTask).not.toHaveBeenCalled();
    expect(mockProps.onAskCoach).not.toHaveBeenCalled();
  });
});