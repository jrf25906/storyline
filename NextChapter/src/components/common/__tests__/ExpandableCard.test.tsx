import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ExpandableCard } from '../ExpandableCard';

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
    text: { primary: '#000000', secondary: '#666666', disabled: '#999999' },
    neutral: { black: '#000000' },
    success: { light: '#c8e6c9' },
    warning: { light: '#fff3e0' },
    primary: { light: '#e3f2fd' },
  },
}));

jest.mock('../../../theme/typography', () => ({
  Typography: {
    heading: { h4: { fontSize: 16, fontWeight: '600' } },
    body: { medium: { fontSize: 14 } },
  },
}));

jest.mock('../../../theme/spacing', () => ({
  Spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
}));

// Mock LayoutAnimation and Platform
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  configureNext: jest.fn(),
  Types: { easeInEaseOut: 'easeInEaseOut' },
  Properties: { opacity: 'opacity' },
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
}));

describe('ExpandableCard', () => {
  const defaultProps = {
    title: 'Job Application Details',
    subtitle: 'Software Engineer at TechCorp',
    children: (
      <View>
        <Text>Application Status: In Review</Text>
        <Text>Applied Date: 2024-01-15</Text>
        <Text>Next Steps: Phone Interview</Text>
      </View>
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and subtitle correctly', () => {
    const { getByText } = render(<ExpandableCard {...defaultProps} />);
    
    expect(getByText('Job Application Details')).toBeTruthy();
    expect(getByText('Software Engineer at TechCorp')).toBeTruthy();
  });

  it('renders collapsed by default', () => {
    const { queryByText } = render(<ExpandableCard {...defaultProps} />);
    
    // Content should not be visible when collapsed
    expect(queryByText('Application Status: In Review')).toBeNull();
    expect(queryByText('Applied Date: 2024-01-15')).toBeNull();
  });

  it('renders expanded when initiallyExpanded is true', () => {
    const { getByText } = render(
      <ExpandableCard {...defaultProps} initiallyExpanded={true} />
    );
    
    // Content should be visible when expanded
    expect(getByText('Application Status: In Review')).toBeTruthy();
    expect(getByText('Applied Date: 2024-01-15')).toBeTruthy();
  });

  it('toggles expansion when header is pressed', () => {
    const { getByText, queryByText } = render(<ExpandableCard {...defaultProps} />);
    
    const header = getByText('Job Application Details');
    
    // Initially collapsed
    expect(queryByText('Application Status: In Review')).toBeNull();
    
    // Tap to expand
    fireEvent.press(header);
    expect(getByText('Application Status: In Review')).toBeTruthy();
    
    // Tap to collapse
    fireEvent.press(header);
    expect(queryByText('Application Status: In Review')).toBeNull();
  });

  it('calls onToggle callback when expanded state changes', () => {
    const onToggleMock = jest.fn();
    const { getByText } = render(
      <ExpandableCard {...defaultProps} onToggle={onToggleMock} />
    );
    
    const header = getByText('Job Application Details');
    
    fireEvent.press(header);
    expect(onToggleMock).toHaveBeenCalledWith(true);
    
    fireEvent.press(header);
    expect(onToggleMock).toHaveBeenCalledWith(false);
  });

  it('does not toggle when disabled', () => {
    const onToggleMock = jest.fn();
    const { getByText, queryByText } = render(
      <ExpandableCard {...defaultProps} disabled={true} onToggle={onToggleMock} />
    );
    
    const header = getByText('Job Application Details');
    
    fireEvent.press(header);
    
    // Should remain collapsed
    expect(queryByText('Application Status: In Review')).toBeNull();
    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('applies correct accessibility props', () => {
    const { getByRole } = render(
      <ExpandableCard
        {...defaultProps}
        accessibilityLabel="Job details card"
        accessibilityHint="Double tap to expand details"
      />
    );
    
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Job details card');
    expect(button.props.accessibilityHint).toBe('Double tap to expand details');
    expect(button.props.accessibilityState.expanded).toBe(false);
  });

  it('updates accessibility state when expanded', () => {
    const { getByRole, getByText } = render(<ExpandableCard {...defaultProps} />);
    
    const button = getByRole('button');
    const header = getByText('Job Application Details');
    
    // Initially collapsed
    expect(button.props.accessibilityState.expanded).toBe(false);
    
    // Expand
    fireEvent.press(header);
    expect(button.props.accessibilityState.expanded).toBe(true);
  });

  it('renders without subtitle', () => {
    const { getByText, queryByText } = render(
      <ExpandableCard title="Simple Card" children={<Text>Content</Text>} />
    );
    
    expect(getByText('Simple Card')).toBeTruthy();
    expect(queryByText('Software Engineer at TechCorp')).toBeNull();
  });

  it('applies variant styles correctly', () => {
    const { getByText } = render(
      <ExpandableCard {...defaultProps} variant="success" />
    );
    
    // Component should render without errors with variant
    expect(getByText('Job Application Details')).toBeTruthy();
  });

  it('handles all variant types', () => {
    const variants = ['default', 'success', 'warning', 'info'] as const;
    
    variants.forEach(variant => {
      const { getByText } = render(
        <ExpandableCard
          title={`Card with ${variant} variant`}
          variant={variant}
          children={<Text>Content</Text>}
        />
      );
      
      expect(getByText(`Card with ${variant} variant`)).toBeTruthy();
    });
  });

  it('renders complex children correctly', () => {
    const complexChildren = (
      <View>
        <Text>Section 1</Text>
        <View>
          <Text>Nested Item 1</Text>
          <Text>Nested Item 2</Text>
        </View>
        <Text>Section 2</Text>
      </View>
    );

    const { getByText } = render(
      <ExpandableCard
        {...defaultProps}
        initiallyExpanded={true}
        children={complexChildren}
      />
    );
    
    expect(getByText('Section 1')).toBeTruthy();
    expect(getByText('Nested Item 1')).toBeTruthy();
    expect(getByText('Nested Item 2')).toBeTruthy();
    expect(getByText('Section 2')).toBeTruthy();
  });
});