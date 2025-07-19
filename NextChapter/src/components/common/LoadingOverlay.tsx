import React from 'react';
import { View, ActivityIndicator, Text, Modal } from 'react-native';
import { styles } from '@components/common/LoadingOverlay.styles';
import { useTheme } from '@context/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message,
  fullScreen = false 
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  const content = (
    <View 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={message || 'Loading'}
      accessibilityHint="Please wait while the operation completes"
    >
      <View style={[styles.loadingBox, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary}
          accessibilityLabel="Loading indicator"
        />
        {message && (
          <Text 
            style={[styles.message, { color: theme.colors.text }]}
            accessible={true}
            accessibilityRole="text"
          >
            {message}
          </Text>
        )}
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        accessibilityViewIsModal
        accessibilityLabel={message || 'Loading, please wait'}
      >
        {content}
      </Modal>
    );
  }

  return content;
};