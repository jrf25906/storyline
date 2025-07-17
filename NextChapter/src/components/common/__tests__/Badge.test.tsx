import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import Badge from '../Badge';
import { Colors, Typography, Spacing, Motion } from '../../../theme';
import { ThemeProvider } from '../../../context/ThemeContext';
import { lightTheme, darkTheme } from '../../../theme';

// Mock Animated.timing for testing animations
const mockAnimatedTiming = jest.fn(() => ({
  start: jest.fn((callback) => callback && callback()),
}));
(Animated.timing as jest.Mock) = mockAnimatedTiming;

// Helper function to render with theme
const renderWithTheme = (component: React.ReactElement, theme = 'light') => {
  return render(
    <ThemeProvider initialTheme={theme as any}>
      {component}
    </ThemeProvider>
  );
};

describe('Badge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with value', () => {
      const { getByText } = renderWithTheme(<Badge value="5" />);
      expect(getByText('5')).toBeTruthy();
    });

    it('should render with number value', () => {
      const { getByText } = renderWithTheme(<Badge value={10} />);
      expect(getByText('10')).toBeTruthy();
    });

    it('should not render when value is 0', () => {
      const { queryByTestId } = renderWithTheme(<Badge value={0} testID="badge" />);
      expect(queryByTestId('badge')).toBeNull();
    });

    it('should not render when value is empty string', () => {
      const { queryByTestId } = renderWithTheme(<Badge value="" testID="badge" />);
      expect(queryByTestId('badge')).toBeNull();
    });
  });

  describe('Variants - New Design System', () => {
    it('should render success variant with Success Mint background', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="Success" variant="success" testID="badge" />
      );
      const badge = getByTestId('badge');
      const flatStyle = StyleSheet.flatten(badge.props.style);
      expect(flatStyle.backgroundColor).toBe(Colors.successMint);
    });

    it('should render warning variant with Soft Amber background', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="Warning" variant="warning" testID="badge" />
      );
      const badge = getByTestId('badge');
      const flatStyle = StyleSheet.flatten(badge.props.style);
      expect(flatStyle.backgroundColor).toBe(Colors.warning);
    });

    it('should render error variant with Gentle Coral background', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="Error" variant="error" testID="badge" />
      );
      const badge = getByTestId('badge');
      const flatStyle = StyleSheet.flatten(badge.props.style);
      expect(flatStyle.backgroundColor).toBe(Colors.gentleCoral);
    });

    it('should render info variant with Calm Blue background', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="Info" variant="info" testID="badge" />
      );
      const badge = getByTestId('badge');
      const flatStyle = StyleSheet.flatten(badge.props.style);
      expect(flatStyle.backgroundColor).toBe(Colors.calmBlue);
    });
  });

  describe('Typography', () => {
    it('should use caption size typography for small badges', () => {
      const { getByText } = renderWithTheme(<Badge value="Small" size="small" />);
      const text = getByText('Small');
      expect(text.props.style).toMatchObject({
        fontSize: Typography.fontSizes.caption,
      });
    });

    it('should use bodySM size typography for medium badges', () => {
      const { getByText } = renderWithTheme(<Badge value="Medium" size="medium" />);
      const text = getByText('Medium');
      expect(text.props.style).toMatchObject({
        fontSize: Typography.fontSizes.bodySM,
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility role', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="Test" testID="badge" />
      );
      const badge = getByTestId('badge');
      expect(badge.props.accessibilityRole).toBe('text');
    });

    it('should have default accessibility label', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="5" variant="success" testID="badge" />
      );
      const badge = getByTestId('badge');
      expect(badge.props.accessibilityLabel).toBe('success badge: 5');
    });

    it('should use custom accessibility label when provided', () => {
      const { getByTestId } = renderWithTheme(
        <Badge 
          value="New" 
          testID="badge" 
          accessibilityLabel="5 new notifications" 
        />
      );
      const badge = getByTestId('badge');
      expect(badge.props.accessibilityLabel).toBe('5 new notifications');
    });

    it('should ensure text contrast meets WCAG standards', () => {
      const variants = ['success', 'warning', 'error', 'info'] as const;
      
      variants.forEach(variant => {
        const { getByText } = renderWithTheme(
          <Badge value={variant} variant={variant} />
        );
        const text = getByText(variant);
        
        // Check that text color provides sufficient contrast
        // Success and info should use dark text for contrast
        if (variant === 'success' || variant === 'warning') {
          expect(text.props.style).toMatchObject({
            color: Colors.textPrimary,
          });
        } else {
          expect(text.props.style).toMatchObject({
            color: Colors.white,
          });
        }
      });
    });
  });

  describe('Animations', () => {
    it('should animate on mount with fade in', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="New" testID="badge" />
      );
      
      // Check that Animated.timing was called with fade in configuration
      expect(mockAnimatedTiming).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 1,
          duration: Motion.duration.fast,
          useNativeDriver: true,
        })
      );
    });

    it('should animate on value change', () => {
      const { rerender } = renderWithTheme(<Badge value="5" />);
      
      jest.clearAllMocks();
      
      rerender(<Badge value="6" />);
      
      // Check that animation was triggered on value change
      expect(mockAnimatedTiming).toHaveBeenCalled();
    });
  });

  describe('Dark Mode Support', () => {
    it('should adapt colors for dark mode', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="Dark" variant="neutral" testID="badge" />,
        'dark'
      );
      
      const badge = getByTestId('badge');
      expect(badge.props.style).toMatchObject({
        backgroundColor: Colors.dark.surfaceVariant,
      });
    });
  });

  describe('Styling', () => {
    it('should have gentle rounded corners', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="Round" testID="badge" />
      );
      const badge = getByTestId('badge');
      expect(badge.props.style).toMatchObject({
        borderRadius: expect.any(Number),
      });
    });

    it('should apply proper padding using spacing tokens', () => {
      const { getByTestId } = renderWithTheme(
        <Badge value="Padded" size="small" testID="badge" />
      );
      const badge = getByTestId('badge');
      expect(badge.props.style).toMatchObject({
        paddingHorizontal: Spacing.xs,
        paddingVertical: Spacing.xxs,
      });
    });

    it('should accept custom styles', () => {
      const customStyle = { marginTop: 10 };
      const { getByTestId } = renderWithTheme(
        <Badge value="Custom" style={customStyle} testID="badge" />
      );
      const badge = getByTestId('badge');
      expect(badge.props.style).toMatchObject(customStyle);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text gracefully', () => {
      const longText = 'This is a very long badge text that should be handled properly';
      const { getByText } = renderWithTheme(<Badge value={longText} />);
      const text = getByText(longText);
      expect(text).toBeTruthy();
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()';
      const { getByText } = renderWithTheme(<Badge value={specialText} />);
      expect(getByText(specialText)).toBeTruthy();
    });
  });
});