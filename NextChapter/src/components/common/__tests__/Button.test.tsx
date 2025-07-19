import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '@components/common/Button';
import { Colors, Shadows, Borders, Motion } from '@theme';
import { SafeThemeProvider } from '@components/common/SafeThemeProvider';
import '../../../test-utils/styleHelpers'; // Import custom matchers

// Helper to render button with theme
const renderButton = (props: any) => {
  return render(
    <SafeThemeProvider>
      <Button {...props} />
    </SafeThemeProvider>
  );
};

describe('Button', () => {
  const defaultProps = {
    title: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button Variants', () => {
    it('should render primary button with Deep Forest green background', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        variant: 'primary',
      });
      
      const button = getByRole('button');
      expect(button.props.style).toMatchStyle({
        backgroundColor: Colors.primary, // #2D5A27
      });
    });

    it('should render secondary button with transparent background and primary border', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        variant: 'secondary',
      });
      
      const button = getByRole('button');
      expect(button.props.style).toMatchStyle({
        backgroundColor: Colors.transparent,
        borderWidth: Borders.width.medium,
        borderColor: Colors.primary,
      });
    });

    it('should render support button with Calm Blue background and rounded edges', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        variant: 'support',
      });
      
      const button = getByRole('button');
      expect(button.props.style).toMatchStyle({
        backgroundColor: Colors.calmBlue, // #4A6FA5
        borderRadius: Borders.radius.xl, // 24px for rounded pill shape
      });
    });
  });

  describe('Touch Target', () => {
    it('should have minimum height of 56px for comfortable touch target', () => {
      const { getByRole } = renderButton(defaultProps);
      
      const button = getByRole('button');
      expect(button.props.style).toMatchStyle({
        minHeight: 56,
      });
    });

    it('should maintain 56px min height across all sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const { getByRole } = renderButton({
          ...defaultProps,
          size,
        });
        
        const button = getByRole('button');
        expect(button.props.style).toMatchStyle({
          minHeight: 56,
        });
      });
    });
  });

  describe('Active and Hover States', () => {
    it('should apply active opacity when pressed', () => {
      const { getByTestId } = renderButton({
        ...defaultProps,
        testID: 'test-button',
      });
      
      const button = getByTestId('test-button');
      expect(button.props.activeOpacity).toBe(0.85);
    });

    it('should have button shadow for primary variant', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        variant: 'primary',
      });
      
      const button = getByRole('button');
      expect(button.props.style).toMatchStyle(Shadows.button);
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading prop is true', () => {
      const { getByLabelText } = renderButton({
        ...defaultProps,
        loading: true,
      });
      
      const loadingIndicator = getByLabelText('Loading');
      expect(loadingIndicator).toBeTruthy();
    });

    it('should disable button when loading', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        loading: true,
      });
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
      expect(button.props.accessibilityState.busy).toBe(true);
    });
  });

  describe('Disabled State', () => {
    it('should reduce opacity when disabled', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        disabled: true,
      });
      
      const button = getByRole('button');
      expect(button.props.style).toMatchStyle({
        opacity: 0.5,
      });
    });

    it('should use muted colors when disabled', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        disabled: true,
        variant: 'primary',
      });
      
      const button = getByRole('button');
      expect(button.props.style).toMatchStyle({
        backgroundColor: Colors.muted,
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        accessibilityLabel: 'Custom Label',
      });
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Custom Label');
    });

    it('should use title as default ARIA label', () => {
      const { getByRole } = renderButton(defaultProps);
      
      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Test Button');
    });

    it('should have proper accessibility hint', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        accessibilityHint: 'Tap to continue',
      });
      
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Tap to continue');
    });

    it('should announce disabled state', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        disabled: true,
      });
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Text Styles', () => {
    it('should use white text for primary button', () => {
      const { getByText } = renderButton({
        ...defaultProps,
        variant: 'primary',
      });
      
      const text = getByText('Test Button');
      const flattenedStyle = text.props.style.flat().reduce((acc: any, style: any) => ({ ...acc, ...style }), {});
      expect(flattenedStyle.color).toBe(Colors.white);
    });

    it('should use primary color text for secondary button', () => {
      const { getByText } = renderButton({
        ...defaultProps,
        variant: 'secondary',
      });
      
      const text = getByText('Test Button');
      const flattenedStyle = text.props.style.flat().reduce((acc: any, style: any) => ({ ...acc, ...style }), {});
      expect(flattenedStyle.color).toBe(Colors.primary);
    });

    it('should use white text for support button', () => {
      const { getByText } = renderButton({
        ...defaultProps,
        variant: 'support',
      });
      
      const text = getByText('Test Button');
      const flattenedStyle = text.props.style.flat().reduce((acc: any, style: any) => ({ ...acc, ...style }), {});
      expect(flattenedStyle.color).toBe(Colors.white);
    });
  });

  describe('Backward Compatibility', () => {
    it('should still support outline variant mapping to secondary', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        variant: 'outline',
      });
      
      const button = getByRole('button');
      expect(button.props.style).toMatchStyle({
        backgroundColor: Colors.transparent,
        borderWidth: Borders.width.medium,
      });
    });

    it('should handle existing button usage without breaking', () => {
      const { getByRole } = renderButton({
        ...defaultProps,
        variant: 'primary',
        size: 'large',
        fullWidth: true,
      });
      
      const button = getByRole('button');
      expect(button).toBeTruthy();
      expect(button.props.style).toMatchStyle({
        width: '100%',
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByRole } = renderButton({
        ...defaultProps,
        onPress,
      });
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByRole } = renderButton({
        ...defaultProps,
        onPress,
        disabled: true,
      });
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(onPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByRole } = renderButton({
        ...defaultProps,
        onPress,
        loading: true,
      });
      
      const button = getByRole('button');
      fireEvent.press(button);
      
      expect(onPress).not.toHaveBeenCalled();
    });
  });
});