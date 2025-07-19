import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
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

function LayoffDetailsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { 
    onboardingData, 
    saveOnboardingData, 
    canProceed, 
    isLoading,
    error,
    goToNextStep,
    goToPreviousStep,
  } = useOnboarding();
  
  const [selectedOption, setSelectedOption] = useState(onboardingData.layoffTiming || '');
  
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
    if (!selectedOption) {
      Alert.alert('Please select an option', 'Let us know when the layoff happened to continue.');
      return;
    }

    await saveOnboardingData({
      layoffTiming: selectedOption,
    });
    
    navigation.navigate('PersonalInfo' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const radioOptions = [
    { value: 'this-week', label: 'This week' },
    { value: '1-2-weeks', label: '1-2 weeks ago' },
    { value: '3-4-weeks', label: '3-4 weeks ago' },
    { value: 'over-month', label: 'Over a month ago' },
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
        <ProgressDots total={5} current={2} style={styles.progress} />
        
        <Typography variant="h1" color="primary" style={styles.title}>
          When did the layoff happen?
        </Typography>
        
        <Card variant="filled" padding="none" style={styles.optionsCard}>
          <Radio
            options={radioOptions}
            value={selectedOption}
            onValueChange={setSelectedOption}
            accessibilityLabel="When did the layoff happen"
            testID="layoff-timing-radio"
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
            disabled={!selectedOption || isLoading}
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

export default withErrorBoundary(LayoffDetailsScreen, {
  errorMessage: {
    title: 'Setup step unavailable',
    message: "We're having trouble with this step. Please refresh to continue."
  }
});
