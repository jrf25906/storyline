import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@context/ThemeContext';
import { withErrorBoundary } from '@components/common';
import { LoadingOverlay } from '@components/common/LoadingOverlay';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { validateEmail, validatePassword, getAuthErrorMessage, getAuthLoadingMessage } from '@utils/validation';
import { Ionicons } from '@expo/vector-icons';

function LoginScreenContent() {
  const navigation = useNavigation();
  const { 
    signIn, 
    isLoading, 
    error: authError,
    isBiometricSupported,
    isBiometricEnabled,
    biometricType,
    authenticateWithBiometric,
  } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);

  // Clear validation error when user starts typing
  useEffect(() => {
    if (validationError) {
      setValidationError(null);
    }
  }, [email, password]);

  // Try biometric authentication on mount if enabled
  useEffect(() => {
    const tryBiometricAuth = async () => {
      if (isBiometricEnabled && !isSubmitting) {
        setIsAuthenticatingBiometric(true);
        const success = await authenticateWithBiometric();
        setIsAuthenticatingBiometric(false);
        
        if (success) {
          // User is authenticated, navigation will be handled by auth state change
        }
      }
    };

    tryBiometricAuth();
  }, []);

  const handleLogin = async () => {
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

    setIsSubmitting(true);
    setValidationError(null);

    try {
      await signIn(email, password);
    } catch (error) {
      // Error is already handled in AuthContext
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricAuth = async () => {
    setIsAuthenticatingBiometric(true);
    setValidationError(null);
    
    const success = await authenticateWithBiometric();
    setIsAuthenticatingBiometric(false);
    
    if (!success) {
      setValidationError(`${biometricType} authentication failed. Please use your password.`);
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
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            We're here to help you get back on track
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
            accessibilityHint="Enter your email address to sign in"
            editable={!isSubmitting}
          />

          <TextInput
            ref={passwordInputRef}
            style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password to sign in"
            editable={!isSubmitting}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            disabled={isSubmitting}
            accessibilityRole="link"
            accessibilityLabel="Forgot password?"
          >
            <Text style={[styles.forgotPassword, { color: theme.colors.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button, 
              { backgroundColor: theme.colors.primary },
              (isSubmitting || isAuthenticatingBiometric) && styles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={isSubmitting || isAuthenticatingBiometric}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            accessibilityState={{ disabled: isSubmitting || isAuthenticatingBiometric }}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {isBiometricEnabled && (
            <>
              <View style={styles.orContainer}>
                <View style={[styles.orLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.orText, { color: theme.colors.textSecondary }]}>OR</Text>
                <View style={[styles.orLine, { backgroundColor: theme.colors.border }]} />
              </View>

              <TouchableOpacity 
                style={[
                  styles.biometricButton, 
                  { 
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                  isAuthenticatingBiometric && styles.buttonDisabled
                ]}
                onPress={handleBiometricAuth}
                disabled={isSubmitting || isAuthenticatingBiometric}
                accessibilityRole="button"
                accessibilityLabel={`Sign in with ${biometricType}`}
                accessibilityState={{ disabled: isSubmitting || isAuthenticatingBiometric }}
              >
                <Ionicons 
                  name={biometricType.includes('Face') ? 'scan' : 'finger-print'} 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.biometricButtonText, { color: theme.colors.text }]}>
                  {isAuthenticatingBiometric ? 'Authenticating...' : `Sign in with ${biometricType}`}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            onPress={() => navigation.navigate('Signup' as never)}
            disabled={isSubmitting}
            accessibilityRole="link"
            accessibilityLabel="Don't have an account? Sign up"
          >
            <Text style={[styles.link, { color: theme.colors.primary }]}>
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay 
        visible={isSubmitting} 
        message={getAuthLoadingMessage('signin')}
        fullScreen
      />
    </KeyboardAvoidingView>
  );
}

const LoginScreen = withErrorBoundary(LoginScreenContent, {
  errorMessage: {
    title: 'Login screen issue',
    message: "We're having trouble loading the login screen. Please refresh."
  }
});

export default LoginScreen;

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
  forgotPassword: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 20,
    marginTop: -10,
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
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});