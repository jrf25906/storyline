import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useOnboarding } from '@hooks/useOnboarding';

interface OnboardingProgressBarProps {
  currentStepNumber: number;
  totalSteps: number;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStepNumber,
  totalSteps,
}) => {
  const { theme } = useTheme();
  const { progressPercentage } = useOnboarding();

  return (
    <View style={styles.container}>
      <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
        <View
          style={[
            styles.progressFill,
            { 
              backgroundColor: theme.colors.primary, 
              width: `${progressPercentage}%` 
            },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: theme.colors.text }]}>
        Step {currentStepNumber} of {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.6,
  },
});