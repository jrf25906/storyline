import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Typography as TypographyTokens } from '../../theme';

interface TypographyProps {
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
  accessibilityLabel?: string;
  testID?: string;
}

// Display Components
export const DisplayXL: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.displayXL,
          fontWeight: TypographyTokens.fontWeights.bold,
          color: theme.colors.text,
          lineHeight: TypographyTokens.fontSizes.displayXL * 1.2,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export const DisplayLG: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.displayLG,
          fontWeight: TypographyTokens.fontWeights.bold,
          color: theme.colors.text,
          lineHeight: TypographyTokens.fontSizes.displayLG * 1.2,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

// Heading Components
export const H1: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.h1,
          fontWeight: TypographyTokens.fontWeights.bold,
          color: theme.colors.text,
          lineHeight: TypographyTokens.fontSizes.h1 * 1.3,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export const H2: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.h2,
          fontWeight: TypographyTokens.fontWeights.semiBold,
          color: theme.colors.text,
          lineHeight: TypographyTokens.fontSizes.h2 * 1.3,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export const H3: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.headingSM,
          fontWeight: TypographyTokens.fontWeights.semiBold,
          color: theme.colors.text,
          lineHeight: TypographyTokens.fontSizes.headingSM * 1.4,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

// Body Components
export const BodyLG: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.bodyLG,
          fontWeight: TypographyTokens.fontWeights.regular,
          color: theme.colors.text,
          lineHeight: TypographyTokens.fontSizes.bodyLG * 1.6,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export const Body: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.body,
          fontWeight: TypographyTokens.fontWeights.regular,
          color: theme.colors.text,
          lineHeight: TypographyTokens.fontSizes.body * 1.6,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export const BodySM: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.bodySM,
          fontWeight: TypographyTokens.fontWeights.regular,
          color: theme.colors.text,
          lineHeight: TypographyTokens.fontSizes.bodySM * 1.6,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

// Caption Component
export const Caption: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.caption,
          fontWeight: TypographyTokens.fontWeights.regular,
          color: theme.colors.textSecondary,
          lineHeight: TypographyTokens.fontSizes.caption * 1.5,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

// Muted text variant
export const Muted: React.FC<TypographyProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <Text 
      style={[
        { 
          fontSize: TypographyTokens.fontSizes.body,
          fontWeight: TypographyTokens.fontWeights.regular,
          color: theme.colors.textSecondary,
          lineHeight: TypographyTokens.fontSizes.body * 1.6,
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};