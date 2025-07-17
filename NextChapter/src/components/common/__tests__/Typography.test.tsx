import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Typography } from '../Typography';
import { Typography as TypographyTokens } from '../../../theme/typography';
import { Colors } from '../../../theme/colors';

// Helper to flatten style arrays for testing
const getStyle = (element: any) => {
  const style = element.props.style;
  if (Array.isArray(style)) {
    return StyleSheet.flatten(style);
  }
  return style;
};

describe('Typography', () => {
  describe('variant prop', () => {
    it('should render Display variant with correct size', () => {
      const { getByText } = render(
        <Typography variant="display">Welcome to Next Chapter</Typography>
      );
      const text = getByText('Welcome to Next Chapter');
      expect(getStyle(text)).toMatchObject({
        fontSize: 28,
        fontWeight: TypographyTokens.fontWeights.semiBold,
        lineHeight: 28 * TypographyTokens.lineHeights.heading,
      });
    });

    it('should render H1 variant with correct size', () => {
      const { getByText } = render(
        <Typography variant="h1">Page Title</Typography>
      );
      const text = getByText('Page Title');
      expect(getStyle(text)).toMatchObject({
        fontSize: 24,
        fontWeight: TypographyTokens.fontWeights.semiBold,
        lineHeight: 24 * TypographyTokens.lineHeights.subheading,
      });
    });

    it('should render H2 variant with correct size', () => {
      const { getByText } = render(
        <Typography variant="h2">Section Header</Typography>
      );
      const text = getByText('Section Header');
      expect(getStyle(text)).toMatchObject({
        fontSize: 20,
        fontWeight: TypographyTokens.fontWeights.medium,
        lineHeight: 20 * TypographyTokens.lineHeights.section,
      });
    });

    it('should render H3 variant with correct size', () => {
      const { getByText } = render(
        <Typography variant="h3">Subsection</Typography>
      );
      const text = getByText('Subsection');
      expect(getStyle(text)).toMatchObject({
        fontSize: 18,
        fontWeight: TypographyTokens.fontWeights.medium,
        lineHeight: 18 * TypographyTokens.lineHeights.section,
      });
    });

    it('should render Body variant with correct size (default)', () => {
      const { getByText } = render(
        <Typography>Default body text</Typography>
      );
      const text = getByText('Default body text');
      expect(getStyle(text)).toMatchObject({
        fontSize: 16,
        fontWeight: TypographyTokens.fontWeights.regular,
        lineHeight: 16 * TypographyTokens.lineHeights.body,
      });
    });

    it('should render BodyLarge variant with correct size', () => {
      const { getByText } = render(
        <Typography variant="bodyLarge">Important text</Typography>
      );
      const text = getByText('Important text');
      expect(getStyle(text)).toMatchObject({
        fontSize: 18,
        fontWeight: TypographyTokens.fontWeights.regular,
        lineHeight: 18 * TypographyTokens.lineHeights.body,
      });
    });

    it('should render Caption variant with correct size', () => {
      const { getByText } = render(
        <Typography variant="caption">Metadata</Typography>
      );
      const text = getByText('Metadata');
      expect(getStyle(text)).toMatchObject({
        fontSize: 14,
        fontWeight: TypographyTokens.fontWeights.regular,
        lineHeight: 14 * TypographyTokens.lineHeights.normal,
      });
    });

    it('should render Button variant with correct size', () => {
      const { getByText } = render(
        <Typography variant="button">Click me</Typography>
      );
      const text = getByText('Click me');
      expect(getStyle(text)).toMatchObject({
        fontSize: 16,
        fontWeight: TypographyTokens.fontWeights.medium,
        lineHeight: 16 * TypographyTokens.lineHeights.tight,
      });
    });
  });

  describe('color prop', () => {
    it('should apply primary color', () => {
      const { getByText } = render(
        <Typography color="primary">Primary text</Typography>
      );
      const text = getByText('Primary text');
      expect(getStyle(text)).toMatchObject({
        color: Colors.textPrimary,
      });
    });

    it('should apply secondary color', () => {
      const { getByText } = render(
        <Typography color="secondary">Secondary text</Typography>
      );
      const text = getByText('Secondary text');
      expect(getStyle(text)).toMatchObject({
        color: Colors.textSecondary,
      });
    });

    it('should apply tertiary color', () => {
      const { getByText } = render(
        <Typography color="tertiary">Tertiary text</Typography>
      );
      const text = getByText('Tertiary text');
      expect(getStyle(text)).toMatchObject({
        color: Colors.textTertiary,
      });
    });

    it('should apply error color', () => {
      const { getByText } = render(
        <Typography color="error">Error text</Typography>
      );
      const text = getByText('Error text');
      expect(getStyle(text)).toMatchObject({
        color: Colors.error,
      });
    });

    it('should apply success color', () => {
      const { getByText } = render(
        <Typography color="success">Success text</Typography>
      );
      const text = getByText('Success text');
      expect(getStyle(text)).toMatchObject({
        color: Colors.success,
      });
    });

    it('should apply custom color string', () => {
      const { getByText } = render(
        <Typography color="#FF0000">Custom color text</Typography>
      );
      const text = getByText('Custom color text');
      expect(getStyle(text)).toMatchObject({
        color: '#FF0000',
      });
    });
  });

  describe('weight prop', () => {
    it('should apply custom weight', () => {
      const { getByText } = render(
        <Typography weight="bold">Bold text</Typography>
      );
      const text = getByText('Bold text');
      expect(getStyle(text)).toMatchObject({
        fontWeight: TypographyTokens.fontWeights.bold,
      });
    });

    it('should not allow light weight (300)', () => {
      const { getByText } = render(
        <Typography weight="light">Light text</Typography>
      );
      const text = getByText('Light text');
      // Should default to regular instead of light
      expect(getStyle(text)).toMatchObject({
        fontWeight: TypographyTokens.fontWeights.regular,
      });
    });
  });

  describe('align prop', () => {
    it('should apply left alignment', () => {
      const { getByText } = render(
        <Typography align="left">Left aligned</Typography>
      );
      const text = getByText('Left aligned');
      expect(getStyle(text)).toMatchObject({
        textAlign: 'left',
      });
    });

    it('should apply center alignment', () => {
      const { getByText } = render(
        <Typography align="center">Center aligned</Typography>
      );
      const text = getByText('Center aligned');
      expect(getStyle(text)).toMatchObject({
        textAlign: 'center',
      });
    });

    it('should apply right alignment', () => {
      const { getByText } = render(
        <Typography align="right">Right aligned</Typography>
      );
      const text = getByText('Right aligned');
      expect(getStyle(text)).toMatchObject({
        textAlign: 'right',
      });
    });
  });

  describe('additional props', () => {
    it('should apply custom style', () => {
      const { getByText } = render(
        <Typography style={{ marginBottom: 20 }}>Custom style</Typography>
      );
      const text = getByText('Custom style');
      expect(getStyle(text)).toMatchObject({
        marginBottom: 20,
      });
    });

    it('should apply numberOfLines prop', () => {
      const { getByText } = render(
        <Typography numberOfLines={2}>Multi-line text that might be truncated</Typography>
      );
      const text = getByText('Multi-line text that might be truncated');
      expect(text.props.numberOfLines).toBe(2);
    });

    it('should apply testID for testing', () => {
      const { getByTestId } = render(
        <Typography testID="typography-test">Test ID text</Typography>
      );
      expect(getByTestId('typography-test')).toBeTruthy();
    });

    it('should apply accessibility props', () => {
      const { getByRole } = render(
        <Typography accessibilityRole="header" accessibilityLevel={1}>
          Accessible header
        </Typography>
      );
      const text = getByRole('header');
      expect(text.props.accessibilityLevel).toBe(1);
    });
  });

  describe('font family', () => {
    it('should use Inter font for headings', () => {
      const { getByText } = render(
        <Typography variant="h1">Heading with Inter</Typography>
      );
      const text = getByText('Heading with Inter');
      expect(getStyle(text)).toMatchObject({
        fontFamily: TypographyTokens.fontFamily.primary,
      });
    });

    it('should use system font for body text', () => {
      const { getByText } = render(
        <Typography variant="body">Body with system font</Typography>
      );
      const text = getByText('Body with system font');
      expect(getStyle(text)).toMatchObject({
        fontFamily: TypographyTokens.fontFamily.body,
      });
    });
  });

  describe('nested components', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <Typography>
          Text with <Typography variant="button">nested button</Typography> text
        </Typography>
      );
      expect(getByText('nested button')).toBeTruthy();
    });
  });
});