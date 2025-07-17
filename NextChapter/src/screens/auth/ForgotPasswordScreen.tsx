import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { withErrorBoundary } from '../../components/common';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { validateEmail, getAuthErrorMessage, getAuthLoadingMessage } from '../../utils/validation';

function ForgotPasswordScreenContent() {
  const navigation = useNavigation();
  const { resetPassword, isLoading, error: authError } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear validation error when user starts typing
  useEffect(() => {
    if (validationError && !submitted) {
      setValidationError(null);
    }
  }, [email, submitted]);

  const handleResetPassword = async () => {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setValidationError(emailValidation.message || 'Invalid email');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (error) {
      // Error is already handled in AuthContext
      console.error('Reset password error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = validationError || (authError ? getAuthErrorMessage(authError) : null);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {submitted ? 'Check Your Email' : 'Reset Password'}
          </Text>
          
          {!submitted ? (
            <>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                No worries, it happens to everyone. Enter your email and we'll help you get back in.
              </Text>

              {displayError && (
                <ErrorMessage 
                  message={displayError} 
                  type="error"
                  onDismiss={() => {
                    setValidationError(null);
                  }}
                />
              )}
              
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                placeholder="Email"
                placeholderTextColor={theme.colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
                accessibilityLabel="Email address"
                accessibilityHint="Enter your email to receive reset instructions"
                editable={!isSubmitting}
              />
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  { backgroundColor: theme.colors.primary },
                  isSubmitting && styles.buttonDisabled
                ]}
                onPress={handleResetPassword}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Send reset instructions"
                accessibilityState={{ disabled: isSubmitting }}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✉️</Text>
              <Text style={[styles.successText, { color: theme.colors.text }]}>
                We've sent password reset instructions to {email}
              </Text>
              <Text style={[styles.successSubtext, { color: theme.colors.textSecondary }]}>
                Please check your inbox and follow the link to reset your password.
              </Text>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Login' as never)}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
              >
                <Text style={styles.buttonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {!submitted && (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
              accessibilityRole="link"
              accessibilityLabel="Back to sign in"
            >
              <Text style={[styles.link, { color: theme.colors.primary }]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <LoadingOverlay 
        visible={isSubmitting} 
        message={getAuthLoadingMessage('reset')}
        fullScreen
      />
    </KeyboardAvoidingView>
  );
}

const ForgotPasswordScreen = withErrorBoundary(ForgotPasswordScreenContent, {
  errorMessage: {
    title: 'Password reset unavailable',
    message: "We're having trouble with password reset. Please try again."
  }
});

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  successSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 30,
  },
});