import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { styles } from '@components/common/ErrorMessage.styles';
import { useTheme } from '@context/ThemeContext';
import { useEffect, useRef } from 'react';

interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  testID?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'error',
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000,
  testID = 'error-message',
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide if enabled
    if (autoHide && onDismiss) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [fadeAnim, autoHide, autoHideDelay, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💙'; // Using heart instead of red alert for stress-friendly design
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'warning':
        return theme.colors.warning || '#FFA500';
      case 'info':
        return theme.colors.info || '#3498db';
      default:
        return theme.colors.error || '#e74c3c';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: getBackgroundColor(),
        },
      ]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.content}>
        <Text style={styles.icon} accessibilityLabel={`${type} message`}>
          {getIcon()}
        </Text>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss message"
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};