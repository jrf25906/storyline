import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import TaskCompletionCard from '../TaskCompletionCard';
import { ThemeProvider } from '../../../../context/ThemeContext';

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
    white: '#FFFFFF',
    successMint: '#00C896',
  },
  Typography: {
    fontSizes: {
      body: 16,
      bodySM: 14,
      headingMD: 20,
    },
    fontWeights: {
      semiBold: '600',
    },
  },
  Spacing: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
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
    white: '#FFFFFF',
    text: '#1D2B1F',
    textSecondary: '#5A6B5D',
  },
};

jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('TaskCompletionCard', () => {
  const defaultProps = {
    taskTitle: 'Update Your Resume',
    onNextTask: jest.fn(),
    scaleAnimation: new Animated.Value(1),
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

  it('should render task title', () => {
    const { getByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    expect(getByText('Update Your Resume')).toBeTruthy();
  });

  it('should render default message', () => {
    const { getByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    expect(getByText('Nice work! That was a big one.')).toBeTruthy();
  });

  it('should render custom message', () => {
    const customMessage = 'Great job completing this task!';
    const { getByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} message={customMessage} />
    );

    expect(getByText(customMessage)).toBeTruthy();
  });

  it('should display notes message when notes are provided', () => {
    const { getByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} notes="Some task notes" />
    );

    expect(getByText('Your notes are saved in your tools.')).toBeTruthy();
  });

  it('should not display notes message when no notes provided', () => {
    const { queryByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    expect(queryByText('Your notes are saved in your tools.')).toBeNull();
  });

  it('should display checkmark icon', () => {
    const { UNSAFE_getByProps } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    expect(UNSAFE_getByProps({ name: 'checkmark', size: 32 })).toBeTruthy();
  });

  it('should render next task button', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    expect(getByText("View Tomorrow's Task")).toBeTruthy();
    expect(getByLabelText("View tomorrow's task")).toBeTruthy();
  });

  it('should handle next task button press', () => {
    const onNextTask = jest.fn();
    const { getByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} onNextTask={onNextTask} />
    );

    fireEvent.press(getByText("View Tomorrow's Task"));
    expect(onNextTask).toHaveBeenCalledTimes(1);
  });

  it('should apply scale animation', () => {
    const scaleValue = new Animated.Value(0.8);
    const { UNSAFE_getByType } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} scaleAnimation={scaleValue} />
    );

    const animatedView = UNSAFE_getByType(Animated.View);
    expect(animatedView.props.style.transform).toEqual([{ scale: scaleValue }]);
  });

  it('should apply theme colors correctly', () => {
    const { getByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    const title = getByText('Update Your Resume');
    expect(title.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#1D2B1F' }) // theme.colors.text
      ])
    );

    const message = getByText('Nice work! That was a big one.');
    expect(message.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#1D2B1F' }) // theme.colors.text
      ])
    );
  });

  it('should have proper accessibility role for button', () => {
    const { getByLabelText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    const button = getByLabelText("View tomorrow's task");
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('should apply card props correctly', () => {
    const { UNSAFE_getByProps } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    const card = UNSAFE_getByProps({ variant: 'progress' });
    expect(card).toBeTruthy();
    expect(card.props.shadow).toBe(true);
  });

  it('should style button with success color', () => {
    const { getByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} />
    );

    const buttonText = getByText("View Tomorrow's Task");
    expect(buttonText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#00C896' }) // Colors.successMint
      ])
    );
  });

  it('should handle different scale values', () => {
    const { UNSAFE_getByType, rerender } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} scaleAnimation={new Animated.Value(1)} />
    );

    let animatedView = UNSAFE_getByType(Animated.View);
    expect(animatedView.props.style.transform[0].scale._value).toBe(1);

    const newScale = new Animated.Value(1.2);
    rerender(
      <ThemeProvider>
        <TaskCompletionCard {...defaultProps} scaleAnimation={newScale} />
      </ThemeProvider>
    );

    animatedView = UNSAFE_getByType(Animated.View);
    expect(animatedView.props.style.transform[0].scale._value).toBe(1.2);
  });

  it('should apply notes text color from theme', () => {
    const { getByText } = renderWithTheme(
      <TaskCompletionCard {...defaultProps} notes="Task notes" />
    );

    const notesText = getByText('Your notes are saved in your tools.');
    expect(notesText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#5A6B5D' }) // theme.colors.textSecondary
      ])
    );
  });
});