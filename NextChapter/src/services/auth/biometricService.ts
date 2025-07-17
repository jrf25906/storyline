import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = '@next_chapter/biometric_enabled';
const BIOMETRIC_USER_KEY = '@next_chapter/biometric_user';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export class BiometricService {
  static async isBiometricSupported(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    return compatible && enrolled;
  }

  static async getBiometricType(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  static async enableBiometric(userId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      await SecureStore.setItemAsync(BIOMETRIC_USER_KEY, userId);
    } catch (error) {
      throw new Error('Failed to enable biometric authentication');
    }
  }

  static async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_USER_KEY);
    } catch (error) {
      throw new Error('Failed to disable biometric authentication');
    }
  }

  static async authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
      const isSupported = await this.isBiometricSupported();
      if (!isSupported) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is not enabled',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Next Chapter',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        const userId = await SecureStore.getItemAsync(BIOMETRIC_USER_KEY);
        return {
          success: true,
          userId: userId || undefined,
        };
      } else {
        return {
          success: false,
          error: result.error === 'user_cancel' 
            ? 'Authentication cancelled' 
            : 'Authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async promptForBiometricEnrollment(userId: string): Promise<boolean> {
    try {
      const isSupported = await this.isBiometricSupported();
      if (!isSupported) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication for faster login',
        fallbackLabel: 'Skip',
        disableDeviceFallback: false,
        cancelLabel: 'Skip for now',
      });

      if (result.success) {
        await this.enableBiometric(userId);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  static async getBiometricTypeString(): Promise<string> {
    const types = await this.getBiometricType();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Recognition';
    }
    
    return 'Biometric Authentication';
  }
}