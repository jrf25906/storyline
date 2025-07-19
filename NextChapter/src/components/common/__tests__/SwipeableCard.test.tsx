import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SwipeableCard, SwipeAction } from '@components/common/SwipeableCard';

// Mock the animations
jest.mock('../../../hooks/useAnimations', () => ({
  useCardPressAnimation: () => ({
    pressIn: jest.fn(),
    pressOut: jest.fn(),
    animatedStyle: {},
  }),
}));

// Mock theme imports
jest.mock('../../../theme/colors', () => ({
  Colors: {
    background: { secondary: '#f5f5f5', disabled: '#e0e0e0' },
    border: { light: '#e0e0e0', medium: '#bdbdbd' },
    text: { primary: '#000000', secondary: '#666666', inverse: '#ffffff', disabled: '#999999' },
    neutral: { black: '#000000' },
  },
}));

jest.mock('../../../theme/typography', () => ({
  Typography: {
    body: { small: { fontSize: 12 } },
  },
}));

jest.mock('../../../theme/spacing', () => ({
  Spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
}));

// Mock PanResponder (built into React Native, no need to mock)

describe('SwipeableCard', () => {
  const mockLeftAction: SwipeAction = {
    id: 'complete',
    label: 'Complete',
    icon: '✓',
    color: '#FFFFFF',
    backgroundColor: '#4CAF50',
    onPress: jest.fn(),
  };

  const mockRightAction: SwipeAction = {
    id: 'delete',
    label: 'Delete',
    icon: '🗑️',
    color: '#FFFFFF',
    backgroundColor: '#F44336',
    onPress: jest.fn(),
  };

  const defaultProps = {
    children: <Text>Card Content</Text>,
    leftActions: [mockLeftAction],
    rightActions: [mockRightAction],
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders card content correctly', () => {
    const { getByText } = render(<SwipeableCard {...defaultProps} />);
    
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('renders left actions when provided', () => {
    const { getByText } = render(<SwipeableCard {...defaultProps} />);
    
    expect(getByText('Complete')).toBeTruthy();
    expect(getByText('✓')).toBeTruthy();
  });

  it('renders right actions when provided', () => {
    const { getByText } = render(<SwipeableCard {...defaultProps} />);
    
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('🗑️')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByText } = render(<SwipeableCard {...defaultProps} />);
    
    fireEvent.press(getByText('Card Content'));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByText } = render(
      <SwipeableCard {...defaultProps} disabled={true} />
    );
    
    fireEvent.press(getByText('Card Content'));
    expect(defaultProps.onPress).not.toHaveBeenCalled();
  });

  it('renders without actions', () => {
    const { getByText } = render(
      <SwipeableCard onPress={defaultProps.onPress}>
        <Text>Simple Card</Text>
      </SwipeableCard>
    );
    
    expect(getByText('Simple Card')).toBeTruthy();
  });

  it('applies correct accessibility props', () => {
    const { getByRole } = render(
      <SwipeableCard
        {...defaultProps}
        accessibilityLabel="Job Application Card"
        accessibilityHint="Swipe to complete or delete"
      />
    );
    
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Job Application Card');
    expect(button.props.accessibilityHint).toBe('Swipe to complete or delete');
  });

  it('includes accessibility actions for swipe actions', () => {
    const { getByRole } = render(<SwipeableCard {...defaultProps} />);
    
    const button = getByRole('button');
    expect(button.props.accessibilityActions).toEqual([
      { name: 'complete', label: 'Complete' },
      { name: 'delete', label: 'Delete' },
    ]);
  });

  it('renders with custom children', () => {
    const customChildren = (
      <View>
        <Text>Job Title</Text>
        <Text>Company Name</Text>
        <Text>Applied Date</Text>
      </View>
    );

    const { getByText } = render(
      <SwipeableCard {...defaultProps}>
        {customChildren}
      </SwipeableCard>
    );
    
    expect(getByText('Job Title')).toBeTruthy();
    expect(getByText('Company Name')).toBeTruthy();
    expect(getByText('Applied Date')).toBeTruthy();
  });

  it('handles multiple left actions', () => {
    const multipleLeftActions = [
      mockLeftAction,
      {
        id: 'archive',
        label: 'Archive',
        icon: '📁',
        color: '#FFFFFF',
        backgroundColor: '#FF9800',
        onPress: jest.fn(),
      },
    ];

    const { getByText } = render(
      <SwipeableCard {...defaultProps} leftActions={multipleLeftActions} />
    );
    
    expect(getByText('Complete')).toBeTruthy();
    expect(getByText('Archive')).toBeTruthy();
  });

  it('handles multiple right actions', () => {
    const multipleRightActions = [
      mockRightAction,
      {
        id: 'edit',
        label: 'Edit',
        icon: '✏️',
        color: '#FFFFFF',
        backgroundColor: '#2196F3',
        onPress: jest.fn(),
      },
    ];

    const { getByText } = render(
      <SwipeableCard {...defaultProps} rightActions={multipleRightActions} />
    );
    
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('Edit')).toBeTruthy();
  });
});