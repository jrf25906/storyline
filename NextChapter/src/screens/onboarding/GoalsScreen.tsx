import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { useOnboarding } from '@hooks/useOnboarding';
import { Typography } from '@components/common/Typography';
import Button from '@components/common/Button';
import Card from '@components/common/Card';
import Radio from '@components/common/Radio';
import ProgressDots from '@components/feature/onboarding/ProgressDots';
import { Colors, Spacing, Motion } from '@theme';
import { withErrorBoundary } from '@components/common';

function GoalsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { 
    onboardingData, 
    saveOnboardingData,
    completeOnboarding,
    isLoading,
    error,
    goToNextStep,
    goToPreviousStep,
  } = useOnboarding();
  
  const [selectedGoal, setSelectedGoal] = useState(onboardingData.primaryGoal || '');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Animate in the screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Motion.duration.standard,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: Motion.duration.standard,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleNext = async () => {
    if (!selectedGoal) {
      Alert.alert('Please select an option', 'Let us know your primary goal to continue.');
      return;
    }

    await saveOnboardingData({
      primaryGoal: selectedGoal,
    });
    
    // Navigate to signup after completing onboarding
    navigation.navigate('Signup' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const goalOptions = [
    { value: 'same-role', label: 'Find a similar role' },
    { value: 'career-change', label: 'Change careers' },
    { value: 'level-up', label: 'Level up my position' },
    { value: 'freelance', label: 'Start freelancing' },
    { value: 'break', label: 'Take a career break' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <ProgressDots total={5} current={4} style={styles.progress} />
        
        <Typography variant="h1" color="primary" style={styles.title}>
          What's your primary goal?
        </Typography>
        
        <Card variant="filled" padding="none" style={styles.optionsCard}>
          <Radio
            options={goalOptions}
            value={selectedGoal}
            onValueChange={setSelectedGoal}
            accessibilityLabel="Select your primary goal"
            testID="goal-radio"
          />
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="secondary"
            size="medium"
            style={styles.backButton}
            testID="back-button"
          />
          
          <Button
            title="Continue"
            onPress={handleNext}
            variant="primary"
            size="medium"
            loading={isLoading}
            disabled={!selectedGoal || isLoading}
            style={styles.continueButton}
            testID="continue-button"
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.screenPadding,
    paddingTop: Spacing.xxl,
  },
  progress: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xl,
  },
  optionsCard: {
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});

export default withErrorBoundary(GoalsScreen, {
  errorMessage: {
    title: 'Goals setup needs a moment',
    message: "Let's try loading your goals setup again."
  }
});
