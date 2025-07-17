import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/api/supabase';
import { logAnalyticsEvent } from '../../utils/analytics';
import { withErrorBoundary } from '../../components/common';

export const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    // Check if email is already verified
    checkEmailVerification();

    // Set up polling to check verification status
    const interval = setInterval(checkEmailVerification, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cooldown timer for resend button
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const checkEmailVerification = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser?.email_confirmed_at) {
        setEmailVerified(true);
        setIsVerifying(false);
        
        // Log analytics event
        logAnalyticsEvent('email_verified', { email: currentUser.email });
        
        // Show success message and navigate
        Alert.alert(
          'Email Verified!',
          'Your email has been successfully verified. You can now access all features.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Welcome' as never),
            },
          ]
        );
      } else {
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Error checking email verification:', error);
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !user?.email) return;

    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      // Set cooldown
      setResendCooldown(60); // 60 seconds cooldown
      
      Alert.alert(
        'Email Sent',
        'A new verification email has been sent. Please check your inbox and spam folder.',
        [{ text: 'OK' }]
      );
      
      logAnalyticsEvent('verification_email_resent', { email: user.email });
    } catch (error) {
      console.error('Error resending verification email:', error);
      Alert.alert(
        'Error',
        'Failed to resend verification email. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    Alert.alert(
      'Change Email',
      'Are you sure you want to change your email address? You will need to sign up again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Email',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              navigation.navigate('Signup' as never);
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
        },
      ]
    );
  };

  if (isVerifying) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Checking verification status...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (emailVerified) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Email Verified!</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Your email has been successfully verified.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="mail-outline" size={80} color={theme.colors.primary} />
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>Verify Your Email</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          We've sent a verification link to:
        </Text>
        <Text style={[styles.email, { color: theme.colors.text }]}>
          {user?.email || ''}
        </Text>

        <View style={[styles.infoBox, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Please check your email and click the verification link. This screen will automatically update once your email is verified.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
            (isResending || resendCooldown > 0) && styles.buttonDisabled,
          ]}
          onPress={handleResendEmail}
          disabled={isResending || resendCooldown > 0}
        >
          {isResending ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.buttonText}>
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend Verification Email'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleChangeEmail}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            Wrong email? Change it
          </Text>
        </TouchableOpacity>

        <View style={[styles.tipSection, { backgroundColor: theme.colors.warningLight }]}>
          <Text style={[styles.tipTitle, { color: theme.colors.warningDark }]}>
            Can't find the email?
          </Text>
          <Text style={[styles.tipText, { color: theme.colors.text }]}>
            • Check your spam or junk folder{'\n'}
            • Add noreply@nextchapter.app to your contacts{'\n'}
            • Wait a few minutes and try resending
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  linkButton: {
    paddingVertical: 8,
    marginBottom: 24,
  },
  linkText: {
    fontSize: 16,
  },
  tipSection: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default withErrorBoundary(EmailVerificationScreen, {
  errorMessage: {
    title: 'Email verification check failed',
    message: "We're having trouble verifying your email. Please check your connection and try again."
  }
});