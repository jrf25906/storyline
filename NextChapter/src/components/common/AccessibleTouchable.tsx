import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  StyleSheet,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import { MINIMUM_TOUCH_TARGET_SIZE } from '../../utils/accessibility';

interface AccessibleTouchableProps extends TouchableOpacityProps {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  minSize?: boolean; // Whether to enforce minimum touch target size
  children: React.ReactNode;
}

/**
 * AccessibleTouchable component ensures all interactive elements
 * meet WCAG 2.1 AA touch target size requirements (48x48dp minimum)
 * and have proper accessibility annotations
 */
export const AccessibleTouchable: React.FC<AccessibleTouchableProps> = ({
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  minSize = true,
  style,
  children,
  ...props
}) => {
  const touchableStyle = [
    minSize && styles.minSize,
    style,
  ];

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      style={touchableStyle}
      {...props}
    >
      {minSize ? (
        <View style={styles.contentWrapper}>
          {children}
        </View>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  minSize: {
    minWidth: MINIMUM_TOUCH_TARGET_SIZE,
    minHeight: MINIMUM_TOUCH_TARGET_SIZE,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AccessibleTouchable;