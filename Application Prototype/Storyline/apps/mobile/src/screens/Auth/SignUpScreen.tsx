/**
 * Sign Up Screen
 * New user registration interface
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { authService } from '../../services/auth/authService';

interface SignUpScreenProps {
  onSignUp: () => void;
  onNavigateToSignIn: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUp,
  onNavigateToSignIn,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = (): string | null => {
    if (!displayName || !email || !password || !confirmPassword) {
      return 'Please fill in all fields';
    }
    
    if (!email.includes('@')) {
      return 'Please enter a valid email address';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (!agreedToTerms) {
      return 'Please agree to the terms and privacy policy';
    }
    
    return null;
  };

  const handleSignUp = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(email, password, displayName);
      Alert.alert(
        'Welcome to Storyline!',
        'Your account has been created. Let\'s start writing your story.',
        [{ text: 'Get Started', onPress: onSignUp }]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start sharing your story</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="How should we call you?"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="At least 6 characters"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeText}>{showPassword ? '👁' : '👁‍🗨'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <Pressable
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            style={styles.termsContainer}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSignUp}
            style={[styles.signUpButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={onNavigateToSignIn}
            style={styles.signInButton}
            disabled={isLoading}
          >
            <Text style={styles.signInText}>Already have an account? Sign In</Text>
          </Pressable>
        </View>

        <View style={styles.safetyContainer}>
          <Text style={styles.safetyTitle}>Your Privacy Matters</Text>
          <Text style={styles.safetyNote}>
            • Your stories are encrypted and private{'\n'}
            • You control who sees your content{'\n'}
            • We never share your personal data
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6E7076',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F4F2',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1B1C1E',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  eyeText: {
    fontSize: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8854D0',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8854D0',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    color: '#6E7076',
    fontSize: 14,
  },
  signUpButton: {
    backgroundColor: '#8854D0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6E7076',
    fontSize: 14,
  },
  signInButton: {
    alignItems: 'center',
  },
  signInText: {
    color: '#8854D0',
    fontSize: 14,
    fontWeight: '500',
  },
  safetyContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#F5F4F2',
    borderRadius: 12,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1C1E',
    marginBottom: 8,
  },
  safetyNote: {
    color: '#6E7076',
    fontSize: 14,
    lineHeight: 20,
  },
});