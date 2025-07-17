import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useEmotionalState } from '../../context/EmotionalStateContext';
import { Spacing } from '../../theme';

interface CrisisModeWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  enableLargerSpacing?: boolean;
  enableSimplification?: boolean;
}

/**
 * CrisisModeWrapper adapts UI for users in crisis mode
 * - Increases spacing between elements
 * - Hides non-essential features
 * - Enlarges touch targets
 */
export function CrisisModeWrapper({
  children,
  style,
  enableLargerSpacing = true,
  enableSimplification = true,
}: CrisisModeWrapperProps) {
  const { emotionalState } = useEmotionalState();
  const isCrisisMode = emotionalState === 'crisis';

  const containerStyle: ViewStyle[] = [
    styles.container,
    style,
    isCrisisMode && enableLargerSpacing && styles.crisisSpacing,
  ];

  if (isCrisisMode && enableSimplification) {
    // Filter out non-essential children if they have a 'nonEssential' prop
    const essentialChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.props.nonEssential) {
        return null;
      }
      return child;
    });

    return <View style={containerStyle}>{essentialChildren}</View>;
  }

  return <View style={containerStyle}>{children}</View>;
}

interface CrisisModeHiddenProps {
  children: ReactNode;
  showInNormalMode?: boolean;
}

/**
 * CrisisModeHidden hides content when user is in crisis mode
 */
export function CrisisModeHidden({ 
  children, 
  showInNormalMode = true 
}: CrisisModeHiddenProps) {
  const { emotionalState } = useEmotionalState();
  const isCrisisMode = emotionalState === 'crisis';

  if (isCrisisMode && showInNormalMode) {
    return null;
  }

  if (!isCrisisMode && !showInNormalMode) {
    return null;
  }

  return <>{children}</>;
}

interface CrisisModeStylesProps {
  normalStyle: ViewStyle;
  crisisStyle?: ViewStyle;
}

/**
 * Hook to get crisis-mode adapted styles
 */
export function useCrisisModeStyles({ 
  normalStyle, 
  crisisStyle 
}: CrisisModeStylesProps): ViewStyle {
  const { emotionalState } = useEmotionalState();
  const isCrisisMode = emotionalState === 'crisis';

  if (isCrisisMode && crisisStyle) {
    return { ...normalStyle, ...crisisStyle };
  }

  return normalStyle;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  crisisSpacing: {
    padding: Spacing.xl, // Increased padding in crisis mode
    gap: Spacing.xl,    // Larger gaps between elements
  },
});