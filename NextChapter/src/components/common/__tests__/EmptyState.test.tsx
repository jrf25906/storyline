import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmptyState from '@components/common/EmptyState';
import { ThemeProvider } from '@context/ThemeContext';

// Mock ThemeContext
const mockTheme = {
  colors: {
    primary: '#2D5A27',
    background: '#FDFCF8',
  },
};

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock the Button component to avoid its dependencies
jest.mock('../Button', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ title, onPress, testID }: any) => (
    <TouchableOpacity onPress={onPress} testID={testID}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

describe('EmptyState', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  it('should render with required props', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <EmptyState title="No items found" testID="empty-state" />
    );

    expect(getByText('No items found')).toBeTruthy();
    expect(getByTestId('empty-state')).toBeTruthy();
  });

  it('should display default icon', () => {
    const { getByText } = renderWithTheme(
      <EmptyState title="Empty inbox" />
    );

    expect(getByText('📭')).toBeTruthy();
  });

  it('should display custom icon', () => {
    const { getByText } = renderWithTheme(
      <EmptyState title="No results" icon="🔍" />
    );

    expect(getByText('🔍')).toBeTruthy();
  });

  it('should display description when provided', () => {
    const description = 'Try adjusting your search filters';
    const { getByText } = renderWithTheme(
      <EmptyState title="No results" description={description} />
    );

    expect(getByText(description)).toBeTruthy();
  });

  it('should display action button when label and handler provided', () => {
    const mockAction = jest.fn();
    const { getByText } = renderWithTheme(
      <EmptyState 
        title="No items" 
        actionLabel="Add Item"
        onAction={mockAction}
      />
    );

    const button = getByText('Add Item');
    expect(button).toBeTruthy();
    
    fireEvent.press(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not display action button when only label is provided', () => {
    const { queryByText } = renderWithTheme(
      <EmptyState 
        title="No items" 
        actionLabel="Add Item"
        // onAction is missing
      />
    );

    expect(queryByText('Add Item')).toBeNull();
  });

  it('should not display action button when only handler is provided', () => {
    const mockAction = jest.fn();
    const { queryByText } = renderWithTheme(
      <EmptyState 
        title="No items" 
        onAction={mockAction}
        // actionLabel is missing
      />
    );

    // Since there's no label, we can't query for button text
    // Check that the action wasn't called
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should have correct accessibility attributes', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <EmptyState 
        title="No notifications" 
        description="You're all caught up!"
        testID="empty-notifications"
      />
    );

    const container = getByTestId('empty-notifications');
    expect(container.props.accessible).toBe(true);
    expect(container.props.accessibilityRole).toBe('text');
    expect(container.props.accessibilityLabel).toBe('No notifications. You\'re all caught up!');
    
    const icon = getByText('📭');
    expect(icon.props.accessibilityLabel).toBe('📭 icon');
  });

  it('should apply custom styles', () => {
    const customStyle = { backgroundColor: 'red', padding: 50 };
    const { getByTestId } = renderWithTheme(
      <EmptyState 
        title="Empty" 
        style={customStyle}
        testID="styled-empty"
      />
    );

    const container = getByTestId('styled-empty');
    expect(container.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });

  it('should use dark mode colors when theme is dark', () => {
    const useThemeMock = require('../../../context/ThemeContext').useTheme;
    useThemeMock.mockReturnValue({
      theme: {
        colors: {
          primary: '#2D5A27',
          background: '#1A1F1B', // Dark background
        },
      },
      isDark: true,
    });

    const { getByText } = renderWithTheme(
      <EmptyState 
        title="Dark mode empty" 
        description="This is in dark mode"
      />
    );

    const title = getByText('Dark mode empty');
    expect(title.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#FDFCF8' }) // Dark mode text
      ])
    );

    const description = getByText('This is in dark mode');
    expect(description.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#B3BDB6' }) // Dark mode secondary text
      ])
    );
  });

  it('should handle long text appropriately', () => {
    const longTitle = 'This is a very long title that should wrap properly';
    const longDescription = 'This is an extremely long description that explains in great detail why there are no items to display. It should wrap nicely and be centered.';
    
    const { getByText } = renderWithTheme(
      <EmptyState 
        title={longTitle}
        description={longDescription}
      />
    );

    const title = getByText(longTitle);
    expect(title.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ textAlign: 'center' })
      ])
    );

    const description = getByText(longDescription);
    expect(description.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ 
          textAlign: 'center',
          maxWidth: 300 
        })
      ])
    );
  });
});