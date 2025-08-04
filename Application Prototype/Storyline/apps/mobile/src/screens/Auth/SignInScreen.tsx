/**
 * Sign In Screen
 * User authentication interface
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

interface SignInScreenProps {
  onSignIn: () => void;
  onNavigateToSignUp: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignIn,
  onNavigateToSignUp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signIn(email, password);
      onSignIn();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address first');
      return;
    }

    try {
      await authService.resetPassword(email);
      Alert.alert(
        'Password Reset',
        'Check your email for password reset instructions'
      );
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message);
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your stories</Text>
        </View>

        <View style={styles.form}>
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
                placeholder="••••••••"
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

          <Pressable
            onPress={handleForgotPassword}
            style={styles.forgotButton}
            disabled={isLoading}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            onPress={handleSignIn}
            style={[styles.signInButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={onNavigateToSignUp}
            style={styles.signUpButton}
            disabled={isLoading}
          >
            <Text style={styles.signUpText}>Create New Account</Text>
          </Pressable>
        </View>

        <Text style={styles.safetyNote}>
          🔒 Your stories are encrypted and private by default
        </Text>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
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
    marginBottom: 20,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#8854D0',
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#8854D0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signInText: {
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
  signUpButton: {
    borderWidth: 1,
    borderColor: '#8854D0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signUpText: {
    color: '#8854D0',
    fontSize: 16,
    fontWeight: '600',
  },
  safetyNote: {
    textAlign: 'center',
    color: '#6E7076',
    fontSize: 12,
    marginTop: 32,
  },
});