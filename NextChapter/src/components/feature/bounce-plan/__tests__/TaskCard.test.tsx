import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TaskCard from '../TaskCard';
import { BouncePlanTaskDefinition } from '../../../../constants/bouncePlanTasks';
import { ThemeProvider } from '../../../../context/ThemeContext';

const mockTask: BouncePlanTaskDefinition = {
  id: 'day1_breathe',
  day: 1,
  title: 'Take a Breath & Acknowledge',
  description: 'Today is about acknowledging what happened.',
  duration: '10 minutes',
  category: 'mindset',
  tips: ['Tip 1', 'Tip 2'],
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('TaskCard', () => {
  it('renders correctly with available status', () => {
    const { getByText, getByRole } = renderWithTheme(
      <TaskCard
        task={mockTask}
        status="available"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('Day 1')).toBeTruthy();
    expect(getByText('Take a Breath & Acknowledge')).toBeTruthy();
    expect(getByText('10 minutes')).toBeTruthy();
  });
  
  it('renders correctly with completed status', () => {
    const { getByText } = renderWithTheme(
      <TaskCard
        task={mockTask}
        status="completed"
        onPress={jest.fn()}
      />
    );
    
    expect(getByText('Completed')).toBeTruthy();
  });
  
  it('renders correctly with locked status', () => {
    const { getByRole } = renderWithTheme(
      <TaskCard
        task={mockTask}
        status="locked"
        onPress={jest.fn()}
      />
    );
    
    const button = getByRole('button');
    expect(button.props.accessibilityHint).toBe('Task is locked');
  });
  
  it('calls onPress when tapped and not locked', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(
      <TaskCard
        task={mockTask}
        status="available"
        onPress={onPress}
      />
    );
    
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
  
  it('does not call onPress when locked', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(
      <TaskCard
        task={mockTask}
        status="locked"
        onPress={onPress}
      />
    );
    
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});