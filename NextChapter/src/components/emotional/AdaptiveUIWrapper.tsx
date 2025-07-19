import React from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { useEmotionalState } from '@context/EmotionalStateContext';
import { getEmotionalAdaptations, applyEmotionalAdaptations } from '@theme/emotionalAdaptations';

interface AdaptiveUIWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  adaptiveStyle?: ViewStyle;
  component?: 'View' | 'ScrollView';
  testID?: string;
}

/**
 * Adaptive UI Wrapper
 * Automatically applies emotional state adaptations to child components
 * Part of Phase 3: Advanced Emotional Intelligence
 */
export function AdaptiveUIWrapper({ 
  children, 
  style, 
  adaptiveStyle,
  component = 'View',
  testID 
}: AdaptiveUIWrapperProps) {
  const { emotionalState } = useEmotionalState();
  
  // Get adaptations for current emotional state
  const adaptations = getEmotionalAdaptations(emotionalState);
  
  // Apply adaptations to base style
  const finalStyle = applyEmotionalAdaptations(
    { ...style, ...adaptiveStyle },
    adaptations?.card || null
  );

  const Component = View; // For now, just use View

  return (
    <Component 
      style={finalStyle}
      testID={testID}
      accessibilityRole="region"
      accessibilityLabel={`Content adapted for ${emotionalState} mode`}
    >
      {children}
    </Component>
  );
}

/**
 * Hook to get adaptive styles based on emotional state
 */
export function useAdaptiveStyles<T extends ViewStyle | TextStyle>(
  baseStyle: T,
  adaptationType: 'button' | 'card' | 'input' | 'text' = 'card'
): T {
  const { emotionalState } = useEmotionalState();
  const adaptations = getEmotionalAdaptations(emotionalState);
  
  const adaptiveStyle = adaptations?.[adaptationType] as Partial<T> | null;
  
  return applyEmotionalAdaptations(baseStyle, adaptiveStyle);
}

/**
 * Hook to get adaptive spacing based on emotional state
 */
export function useAdaptiveSpacing() {
  const { emotionalState } = useEmotionalState();
  const adaptations = getEmotionalAdaptations(emotionalState);
  
  return {
    screenPadding: adaptations?.spacing?.screenPadding || 16,
    componentGap: adaptations?.spacing?.componentGap || 16,
    touchTarget: adaptations?.spacing?.touchTarget || 48,
    cardPadding: adaptations?.spacing?.cardPadding || 16,
  };
}

/**
 * Hook to get adaptive typography based on emotional state
 */
export function useAdaptiveTypography() {
  const { emotionalState } = useEmotionalState();
  const adaptations = getEmotionalAdaptations(emotionalState);
  
  return adaptations?.typography || null;
}