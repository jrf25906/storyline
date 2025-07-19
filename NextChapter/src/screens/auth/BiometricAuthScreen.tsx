import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import { useAuthStore } from '@stores/authStore';
import { theme } from '@theme';

const BiometricAuthScreen: React.FC = () => {
  const {
    isBiometricSupported,
    isBiometricEnabled,
    biometricType,
    enableBiometric,
    disableBiometric,
  } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleToggleBiometric = async () => {
    setIsLoading(true);
    
    try {
      if (isBiometricEnabled) {
        await disableBiometric();
        Alert.alert(
          'Success',
          `${biometricType} authentication has been disabled.`
        );
      } else {
        const success = await enableBiometric();
        if (success) {
          Alert.alert(
            'Success',
            `${biometricType} authentication has been enabled. You can now use it to quickly access the app.`
          );
        } else {
          Alert.alert(
            'Not Enabled',
            `${biometricType} authentication was not enabled. Please try again.`
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to ${isBiometricEnabled ? 'disable' : 'enable'} ${biometricType}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isBiometricSupported) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Biometric Authentication</Text>
          <View style={styles.notSupportedContainer}>
            <Text style={styles.notSupportedText}>
              Biometric authentication is not available on this device.
            </Text>
            <Text style={styles.notSupportedSubtext}>
              Your device either doesn't support biometric authentication or doesn't have any biometric data enrolled.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Biometric Authentication</Text>
        
        <View style={styles.section}>
          <View style={styles.biometricInfo}>
            <Text style={styles.biometricType}>{biometricType}</Text>
            <Text style={styles.biometricDescription}>
              Use {biometricType.toLowerCase()} to quickly and securely access Next Chapter
            </Text>
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Enable {biometricType}</Text>
            <Switch
              value={isBiometricEnabled}
              onValueChange={handleToggleBiometric}
              disabled={isLoading}
              trackColor={{ 
                false: theme.colors.gray300, 
                true: theme.colors.primary 
              }}
              thumbColor={
                Platform.OS === 'ios' 
                  ? theme.colors.white 
                  : isBiometricEnabled 
                    ? theme.colors.primaryDark 
                    : theme.colors.gray100
              }
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            When enabled, you can use {biometricType.toLowerCase()} to authenticate instead of entering your password each time you open the app.
          </Text>
          
          <Text style={[styles.infoTitle, { marginTop: 16 }]}>Privacy & Security</Text>
          <Text style={styles.infoText}>
            Your biometric data is stored securely on your device and never sent to our servers. We only store a secure token that links your account to your device's biometric authentication.
          </Text>
        </View>

        {isBiometricEnabled && (
          <TouchableOpacity 
            style={styles.testButton}
            onPress={async () => {
              const success = await enableBiometric();
              Alert.alert(
                success ? 'Success' : 'Failed',
                success 
                  ? `${biometricType} authentication test successful!`
                  : `${biometricType} authentication test failed.`
              );
            }}
            disabled={isLoading}
          >
            <Text style={styles.testButtonText}>Test {biometricType}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 24,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    ...theme.shadows.small,
  },
  biometricInfo: {
    marginBottom: 20,
  },
  biometricType: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  biometricDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
  },
  toggleLabel: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryDark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  notSupportedContainer: {
    backgroundColor: theme.colors.warningLight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  notSupportedText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.warningDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  notSupportedSubtext: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});

export default withErrorBoundary(BiometricAuthScreen);