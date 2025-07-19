import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Colors, Spacing, Typography, Borders } from '@theme';

interface AvatarProps {
  source?: ImageSourcePropType;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export default function Avatar({
  source,
  name,
  size = 'medium',
  style,
  testID,
  accessibilityLabel,
}: AvatarProps) {
  const { theme } = useTheme();
  const isDark = theme.colors.background === Colors.dark.background;

  const getSizeStyles = () => {
    const sizeMap = {
      small: {
        container: { width: 32, height: 32 },
        text: { fontSize: Typography.fontSizes.bodySM },
      },
      medium: {
        container: { width: 48, height: 48 },
        text: { fontSize: Typography.fontSizes.body },
      },
      large: {
        container: { width: 64, height: 64 },
        text: { fontSize: Typography.fontSizes.headingMD },
      },
      xlarge: {
        container: { width: 96, height: 96 },
        text: { fontSize: Typography.fontSizes.displayXL },
      },
    };
    return sizeMap[size];
  };

  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const sizeStyles = getSizeStyles();
  const backgroundColor = isDark ? Colors.dark.surfaceVariant : Colors.neutral[200];

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor },
        style,
      ]}
      testID={testID}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || (name ? `Avatar for ${name}` : 'User avatar')}
    >
      {source ? (
        <Image
          source={source}
          style={[styles.image, sizeStyles.container]}
          resizeMode="cover"
        />
      ) : name ? (
        <Text 
          style={[
            styles.initials,
            sizeStyles.text,
            { color: isDark ? Colors.dark.textPrimary : Colors.textPrimary }
          ]}
        >
          {getInitials(name)}
        </Text>
      ) : (
        <Text style={[styles.placeholder, sizeStyles.text]}>
          👤
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Borders.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    borderRadius: Borders.radius.full,
  },
  initials: {
    fontWeight: Typography.fontWeights.semiBold,
  },
  placeholder: {
    opacity: 0.5,
  },
});