import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Spacing } from '@theme';

interface ContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'padded' | 'centered' | 'fullscreen';
  style?: ViewStyle;
  testID?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  variant = 'default',
  style,
  testID,
}) => {
  const { theme } = useTheme();
  
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'padded':
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
        };
      case 'centered':
        return {
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: Spacing.lg,
        };
      case 'fullscreen':
        return {
          flex: 1,
          backgroundColor: theme.colors.background,
        };
      default:
        return {};
    }
  };

  return (
    <View 
      style={[
        styles.base,
        getVariantStyles(),
        style
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});