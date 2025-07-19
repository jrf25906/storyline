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

function ExperienceScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { 
    onboardingData, 
    saveOnboardingData,
    completeOnboarding,
    isLoading,
    error,
    goToPreviousStep,
  } = useOnboarding();
  
  const [selectedExperience, setSelectedExperience] = useState(onboardingData.experienceLevel || '');
  
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

  const handleComplete = async () => {
    if (!selectedExperience) {
      Alert.alert('Please select an option', 'Let us know your experience level to continue.');
      return;
    }

    // Save experience level and complete onboarding
    await completeOnboarding({ 
      experienceLevel: selectedExperience,
      ...onboardingData,
    });
    
    // Navigate to main app if successful
    if (!error) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    }
  };

  const handleBack = () => {
    goToPreviousStep();
    navigation.goBack();
  };

  const experienceOptions = [
    { value: 'entry', label: '0-2 years' },
    { value: 'mid', label: '3-5 years' },
    { value: 'senior', label: '6-10 years' },
    { value: 'lead', label: '10+ years' },
    { value: 'executive', label: 'Executive level' },
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
        <ProgressDots total={5} current={5} style={styles.progress} />
        
        <Typography variant="h1" color="primary" style={styles.title}>
          How many years of experience do you have?
        </Typography>
        
        <Card variant="filled" padding="none" style={styles.optionsCard}>
          <Radio
            options={experienceOptions}
            value={selectedExperience}
            onValueChange={setSelectedExperience}
            accessibilityLabel="Select your years of experience"
            testID="experience-radio"
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
            title="Complete Setup"
            onPress={handleComplete}
            variant="primary"
            size="medium"
            loading={isLoading}
            disabled={!selectedExperience || isLoading}
            style={styles.continueButton}
            testID="complete-button"
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

export default withErrorBoundary(ExperienceScreen, {
  errorMessage: {
    title: 'Experience setup issue',
    message: 'We need a moment to load this screen. Please try again.'
  }
});
