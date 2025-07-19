import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '@components/common';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@context/ThemeContext';

const TestAuthScreen = () => {
  const { signUp, signIn, user, error } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');

  const handleSignUp = async () => {
    try {
      await signUp(email, password);
      Alert.alert('Success', 'Check your email for confirmation!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Auth Test Screen
      </Text>
      
      {user ? (
        <Text style={[styles.status, { color: theme.colors.success }]}>
          ✅ Logged in as: {user.email}
        </Text>
      ) : (
        <Text style={[styles.status, { color: theme.colors.error }]}>
          ❌ Not logged in
        </Text>
      )}

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.buttons}>
        <Button title="Sign Up" onPress={handleSignUp} />
        <Button title="Sign In" onPress={handleSignIn} variant="secondary" />
      </View>

      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttons: {
    gap: 10,
    marginTop: 20,
  },
  error: {
    marginTop: 20,
    textAlign: 'center',
  },
});

export default withErrorBoundary(TestAuthScreen);