import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { Typography } from '../../components/common/Typography';
import Button from '../../components/common/Button';
import { Colors, Spacing, Motion } from '../../theme';
import { withErrorBoundary } from '../../components/common';

function WelcomeScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { currentStep, isLoading, goToNextStep } = useOnboarding();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Removed automatic navigation based on currentStep to prevent navigation conflicts
  // Navigation is now handled explicitly through button presses

  useEffect(() => {
    // Animate in the welcome screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Motion.duration.slow,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: Motion.duration.slow,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleGetStarted = () => {
    navigation.navigate('LayoffDetails' as never);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Typography variant="body" color="secondary" style={styles.loadingText}>
          Loading your progress...
        </Typography>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Illustration placeholder */}
        <View style={styles.illustrationPlaceholder}>
          <Typography variant="caption" color="tertiary" align="center">
            [Gentle illustration - sun/growth]
          </Typography>
        </View>
        
        <Typography variant="display" color="primary" align="center" style={styles.title}>
          Welcome to Next Chapter
        </Typography>
        
        <Typography variant="body" color="secondary" align="center" style={styles.subtitle}>
          Let's create your 30-day bounce plan together. This will take about 3 minutes.
        </Typography>
      </Animated.View>
      
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          variant="primary"
          size="large"
          fullWidth
          testID="welcome-get-started"
        />
        
        <View style={styles.signInContainer}>
          <Typography variant="body" color="secondary">
            Already have an account?{' '}
          </Typography>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login' as never)}
            accessibilityRole="link"
            accessibilityLabel="Sign in to existing account"
          >
            <Typography variant="body" color="primary" weight="semiBold">
              Sign In
            </Typography>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: Colors.surfaceSection,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    paddingHorizontal: Spacing.lg,
    maxWidth: 320,
  },
  footer: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
});

export default withErrorBoundary(WelcomeScreen, {
  errorMessage: {
    title: 'Welcome screen loading issue',
    message: "We're excited to have you! Please refresh to continue."
  }
});