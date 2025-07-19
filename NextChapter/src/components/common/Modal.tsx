import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  BackHandler,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSlideInAnimation, useFadeInAnimation } from '@hooks/useAnimations';
import { Colors } from '@theme/colors';
import { Typography } from '@theme/typography';
import { Spacing } from '@theme/spacing';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const insets = useSafeAreaInsets();
  
  const { 
    animate: slideAnimate, 
    animatedStyle: slideStyle, 
    reset: slideReset 
  } = useSlideInAnimation({
    duration: 300,
  });
  
  const { 
    animate: fadeAnimate, 
    animatedStyle: fadeStyle, 
    reset: fadeReset 
  } = useFadeInAnimation({
    duration: 200,
  });

  useEffect(() => {
    if (visible) {
      slideReset();
      fadeReset();
      slideAnimate();
      fadeAnimate();
      
      // Announce modal opening to screen readers
      AccessibilityInfo.announceForAccessibility(
        title ? `${title} dialog opened` : 'Dialog opened'
      );
    }
  }, [visible, slideAnimate, fadeAnimate, slideReset, fadeReset, title]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const getModalSize = () => {
    switch (size) {
      case 'small':
        return { maxWidth: 320, maxHeight: '40%' };
      case 'large':
        return { maxWidth: '95%', maxHeight: '85%' };
      case 'fullscreen':
        return { width: '100%', height: '100%' };
      default: // medium
        return { maxWidth: '90%', maxHeight: '70%' };
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <Animated.View style={[styles.backdrop, fadeStyle]}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.modalContainer,
            getModalSize(),
            { paddingTop: Math.max(insets.top, Spacing.lg) },
            slideStyle,
          ]}
          accessible
          accessibilityRole="dialog"
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View style={styles.header}>
              {title && (
                <Text 
                  style={styles.title}
                  accessibilityRole="header"
                  accessibilityLevel={1}
                >
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                  accessibilityHint="Closes the current dialog"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    shadowColor: Colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSizes.h3,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSection,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Typography.fontSizes.bodyLG,
    fontWeight: Typography.fontWeights.semiBold,
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.lg,
    flex: 1,
  },
});