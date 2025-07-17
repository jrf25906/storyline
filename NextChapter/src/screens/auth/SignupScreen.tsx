import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { withErrorBoundary } from '../../components/common';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { validateEmail, validatePassword, validatePasswordMatch, getAuthErrorMessage, getAuthLoadingMessage } from '../../utils/validation';

function SignupScreenContent() {
  const navigation = useNavigation();
  const { signUp, isLoading, error: authError } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // Clear validation error when user starts typing
  useEffect(() => {
    if (validationError) {
      setValidationError(null);
    }
  }, [email, password, confirmPassword]);

  const handleSignup = async () => {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setValidationError(emailValidation.message || 'Invalid email');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setValidationError(passwordValidation.message || 'Invalid password');
      return;
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
    if (!passwordMatchValidation.isValid) {
      setValidationError(passwordMatchValidation.message || 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      await signUp(email, password);
      // User will be automatically logged in and navigated to Main after successful signup
      // The auth state change is handled by the navigation container
    } catch (error) {
      // Error is already handled in AuthContext
      console.error('Signup error:', error);
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
          <Text style={[styles.title, { color: theme.colors.text }]}>Let's Get Started</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Create your account to begin your journey back
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
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address for your account"
            editable={!isSubmitting}
          />

          <TextInput
            ref={passwordInputRef}
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="Password (6+ characters)"
            placeholderTextColor={theme.colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            accessibilityLabel="Password"
            accessibilityHint="Create a password with at least 6 characters"
            editable={!isSubmitting}
          />

          <TextInput
            ref={confirmPasswordInputRef}
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="Confirm Password"
            placeholderTextColor={theme.colors.placeholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignup}
            accessibilityLabel="Confirm password"
            accessibilityHint="Re-enter your password to confirm"
            editable={!isSubmitting}
          />

          <Text style={[styles.terms, { color: theme.colors.textSecondary }]}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>

          <TouchableOpacity 
            style={[
              styles.button, 
              { backgroundColor: theme.colors.primary },
              isSubmitting && styles.buttonDisabled
            ]}
            onPress={handleSignup}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Create account"
            accessibilityState={{ disabled: isSubmitting }}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login' as never)}
            disabled={isSubmitting}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Sign in"
          >
            <Text style={[styles.link, { color: theme.colors.primary }]}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay 
        visible={isSubmitting} 
        message={getAuthLoadingMessage('signup')}
        fullScreen
      />
    </KeyboardAvoidingView>
  );
}

const SignupScreen = withErrorBoundary(SignupScreenContent, {
  errorMessage: {
    title: 'Sign up screen issue',
    message: "Let's try loading the sign up screen again."
  }
});

export default SignupScreen;

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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
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
});