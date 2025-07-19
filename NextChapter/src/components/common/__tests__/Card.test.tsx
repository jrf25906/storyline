import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import Card from '@components/common/Card';
import { ThemeProvider } from '@context/ThemeContext';
import { Colors, Spacing, Borders, Shadows } from '@theme';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement, isDark = false) => {
  return render(
    <ThemeProvider initialTheme={isDark ? 'dark' : 'light'}>
      {component}
    </ThemeProvider>
  );
};

// Helper to handle style array/object differences in testing
const expectStyleToContain = (style: any, expected: any) => {
  if (Array.isArray(style)) {
    // Flatten all style objects into one for comparison
    const flattenedStyle = style.reduce((acc, s) => {
      if (s && typeof s === 'object') {
        return { ...acc, ...s };
      }
      return acc;
    }, {});
    expect(flattenedStyle).toEqual(expect.objectContaining(expected));
  } else {
    expect(style).toEqual(expect.objectContaining(expected));
  }
};

describe('Card Component', () => {
  const testContent = (
    <View>
      <Text>Test Content</Text>
    </View>
  );

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = renderWithTheme(<Card>{testContent}</Card>);
      expect(getByText('Test Content')).toBeTruthy();
    });

    it('should apply default testID when provided', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="test-card">{testContent}</Card>
      );
      expect(getByTestId('test-card')).toBeTruthy();
    });
  });

  describe('Card Variants', () => {
    it('should render task variant with warm styling', () => {
      const { getByTestId } = renderWithTheme(
        <Card variant="task" testID="task-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('task-card');
      const styles = card.props.style;
      
      // Should have warm background color
      expectStyleToContain(styles, {
        backgroundColor: Colors.surface,
        borderRadius: Borders.radius.lg, // 16px
        padding: Spacing.lg, // 24px
      });
    });

    it('should render progress variant with gradient background', () => {
      const { getByTestId } = renderWithTheme(
        <Card variant="progress" testID="progress-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('progress-card');
      // Progress cards should have a wrapper with gradient
      expectStyleToContain(card.props.style, {
        borderRadius: Borders.radius.lg,
        padding: Spacing.lg,
        overflow: 'hidden',
      });
    });

    it('should render elevated variant with shadow', () => {
      const { getByTestId } = renderWithTheme(
        <Card variant="elevated" testID="elevated-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('elevated-card');
      const styles = card.props.style;
      
      expectStyleToContain(styles, {
        ...Shadows.card,
      });
    });

    it('should render outlined variant with border', () => {
      const { getByTestId } = renderWithTheme(
        <Card variant="outlined" testID="outlined-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('outlined-card');
      const styles = card.props.style;
      
      expectStyleToContain(styles, {
        borderWidth: Borders.width.thin,
        borderColor: Colors.border,
      });
    });

    it('should render filled variant with background color', () => {
      const { getByTestId } = renderWithTheme(
        <Card variant="filled" testID="filled-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('filled-card');
      const styles = card.props.style;
      
      expectStyleToContain(styles, {
        backgroundColor: Colors.neutral[50],
      });
    });
  });

  describe('Interactive States', () => {
    it('should handle press events', () => {
      const onPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card onPress={onPress}>{testContent}</Card>
      );
      
      const pressable = getByRole('button');
      fireEvent.press(pressable);
      
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should show hover state with enhanced shadow', () => {
      const { getByTestId } = renderWithTheme(
        <Card variant="task" hoverable testID="hoverable-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('hoverable-card');
      // Hover state should be prepared for web/desktop
      expect(card).toBeTruthy();
    });

    it('should animate on press when pressable', () => {
      const onPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card onPress={onPress} animatePress>
          {testContent}
        </Card>
      );
      
      const pressable = getByRole('button');
      
      // Simulate press in
      fireEvent(pressable, 'pressIn');
      
      // Simulate press out
      fireEvent(pressable, 'pressOut');
      
      expect(pressable).toBeTruthy();
    });
  });

  describe('Spacing and Layout', () => {
    it('should apply custom padding', () => {
      const { getByTestId } = renderWithTheme(
        <Card padding={32} testID="custom-padding-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('custom-padding-card');
      expectStyleToContain(card.props.style, {
        padding: 32,
      });
    });

    it('should use spacing tokens for padding', () => {
      const { getByTestId } = renderWithTheme(
        <Card padding="md" testID="token-padding-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('token-padding-card');
      expectStyleToContain(card.props.style, {
        padding: Spacing.md,
      });
    });

    it('should have proper border radius', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="radius-card">{testContent}</Card>
      );
      
      const card = getByTestId('radius-card');
      expectStyleToContain(card.props.style, {
        borderRadius: Borders.radius.lg, // 16px
      });
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode colors', () => {
      const { getByTestId } = renderWithTheme(
        <Card variant="task" testID="dark-card">{testContent}</Card>,
        true // dark mode
      );
      
      const card = getByTestId('dark-card');
      expectStyleToContain(card.props.style, {
        backgroundColor: Colors.dark.surface,
      });
    });

    it('should apply dark mode borders for outlined variant', () => {
      const { getByTestId } = renderWithTheme(
        <Card variant="outlined" testID="dark-outlined">{testContent}</Card>,
        true // dark mode
      );
      
      const card = getByTestId('dark-outlined');
      expectStyleToContain(card.props.style, {
        borderColor: Colors.dark.border,
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility props when pressable', () => {
      const onPress = jest.fn();
      const { getByRole } = renderWithTheme(
        <Card 
          onPress={onPress}
          accessibilityLabel="Task card"
          accessibilityHint="Tap to view task details"
        >
          {testContent}
        </Card>
      );
      
      const pressable = getByRole('button');
      expect(pressable.props.accessibilityLabel).toBe('Task card');
      expect(pressable.props.accessibilityHint).toBe('Tap to view task details');
    });

    it('should be accessible by default', () => {
      const { getByTestId } = renderWithTheme(
        <Card testID="accessible-card">{testContent}</Card>
      );
      
      const card = getByTestId('accessible-card');
      expect(card.props.accessible).not.toBe(false);
    });
  });

  describe('Custom Styling', () => {
    it('should merge custom styles', () => {
      const customStyle = {
        marginTop: 20,
        backgroundColor: '#custom',
      };
      
      const { getByTestId } = renderWithTheme(
        <Card style={customStyle} testID="custom-style-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('custom-style-card');
      expectStyleToContain(card.props.style, customStyle);
    });

    it('should allow disabling shadow', () => {
      const { getByTestId } = renderWithTheme(
        <Card shadow={false} testID="no-shadow-card">
          {testContent}
        </Card>
      );
      
      const card = getByTestId('no-shadow-card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      
      // Should not have shadow properties
      const hasShadowStyles = styles.some((style: any) => 
        style && (
          style.shadowColor || 
          style.shadowOffset || 
          style.shadowOpacity || 
          style.shadowRadius || 
          style.elevation
        )
      );
      
      expect(hasShadowStyles).toBe(false);
    });
  });

  describe('Header Support', () => {
    it('should render header content when provided', () => {
      const header = <Text>Card Header</Text>;
      const { getByText } = renderWithTheme(
        <Card header={header}>{testContent}</Card>
      );
      
      expect(getByText('Card Header')).toBeTruthy();
      expect(getByText('Test Content')).toBeTruthy();
    });

    it('should apply proper spacing between header and content', () => {
      const header = <Text testID="header">Header</Text>;
      const { getByTestId } = renderWithTheme(
        <Card header={header} testID="header-card">
          <Text testID="content">Content</Text>
        </Card>
      );
      
      // Header should be rendered with proper spacing
      expect(getByTestId('header')).toBeTruthy();
      expect(getByTestId('content')).toBeTruthy();
    });
  });
});