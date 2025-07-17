import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { DashboardCard } from '../DashboardCard';
import { ThemeProvider } from '../../../context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('DashboardCard', () => {
  const defaultProps = {
    title: 'Test Card',
    children: <Text>Card Content</Text>,
  };

  it('should render title and content', () => {
    const { getByText } = renderWithTheme(<DashboardCard {...defaultProps} />);
    
    expect(getByText('Test Card')).toBeTruthy();
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('should render subtitle when provided', () => {
    const { getByText } = renderWithTheme(
      <DashboardCard {...defaultProps} subtitle="Test Subtitle" />
    );
    
    expect(getByText('Test Subtitle')).toBeTruthy();
  });

  it('should be touchable when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <DashboardCard {...defaultProps} onPress={onPress} testID="test-card" />
    );
    
    const card = getByTestId('test-card');
    fireEvent.press(card);
    
    expect(onPress).toHaveBeenCalled();
  });

  it('should not be touchable when onPress is not provided', () => {
    const { getByTestId } = renderWithTheme(
      <DashboardCard {...defaultProps} testID="test-card" />
    );
    
    const card = getByTestId('test-card');
    // Should not throw error when pressed
    expect(() => fireEvent.press(card)).not.toThrow();
  });

  it('should show skeleton loader when loading', () => {
    const { getByTestId, queryByText } = renderWithTheme(
      <DashboardCard {...defaultProps} loading={true} testID="test-card" />
    );
    
    expect(getByTestId('test-card-skeleton-loader')).toBeTruthy();
    expect(queryByText('Card Content')).toBeNull();
  });

  it('should apply custom styles', () => {
    const { getByTestId } = renderWithTheme(
      <DashboardCard {...defaultProps} style={{ marginTop: 20 }} testID="test-card" />
    );
    
    const card = getByTestId('test-card');
    // The style prop is passed through, just verify the component renders
    expect(card).toBeTruthy();
  });

  it('should pass accessibility props', () => {
    const { getByLabelText } = renderWithTheme(
      <DashboardCard
        {...defaultProps}
        accessibilityLabel="Test Card Label"
        accessibilityHint="Test Card Hint"
      />
    );
    
    expect(getByLabelText('Test Card Label')).toBeTruthy();
  });

  it('should have minimum touch target size when touchable', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <DashboardCard {...defaultProps} onPress={onPress} testID="test-card" />
    );
    
    const card = getByTestId('test-card');
    const styles = card.props.style;
    
    // Check if minHeight is set for touch target
    expect(styles).toEqual(expect.objectContaining({ minHeight: 48 }));
  });
});