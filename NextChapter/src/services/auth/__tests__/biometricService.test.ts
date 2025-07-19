import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BiometricService } from '@services/auth/biometricService';

// Mock expo modules
jest.mock('expo-local-authentication');
jest.mock('expo-secure-store');

describe('BiometricService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBiometricSupported', () => {
    it('should return true when hardware is available and enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await BiometricService.isBiometricSupported();

      expect(result).toBe(true);
      expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
      expect(LocalAuthentication.isEnrolledAsync).toHaveBeenCalled();
    });

    it('should return false when hardware is not available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await BiometricService.isBiometricSupported();

      expect(result).toBe(false);
    });

    it('should return false when not enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const result = await BiometricService.isBiometricSupported();

      expect(result).toBe(false);
    });
  });

  describe('getBiometricType', () => {
    it('should return supported authentication types', async () => {
      const mockTypes = [
        LocalAuthentication.AuthenticationType.FINGERPRINT,
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ];
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue(mockTypes);

      const result = await BiometricService.getBiometricType();

      expect(result).toEqual(mockTypes);
    });
  });

  describe('isBiometricEnabled', () => {
    it('should return true when enabled', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');

      const result = await BiometricService.isBiometricEnabled();

      expect(result).toBe(true);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('@next_chapter/biometric_enabled');
    });

    it('should return false when not enabled', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('false');

      const result = await BiometricService.isBiometricEnabled();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await BiometricService.isBiometricEnabled();

      expect(result).toBe(false);
    });
  });

  describe('enableBiometric', () => {
    it('should store enabled flag and user ID', async () => {
      const userId = 'test-user-123';
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await BiometricService.enableBiometric(userId);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@next_chapter/biometric_enabled', 'true');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@next_chapter/biometric_user', userId);
    });

    it('should throw error on failure', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(BiometricService.enableBiometric('test-user')).rejects.toThrow(
        'Failed to enable biometric authentication'
      );
    });
  });

  describe('disableBiometric', () => {
    it('should delete stored values', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await BiometricService.disableBiometric();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('@next_chapter/biometric_enabled');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('@next_chapter/biometric_user');
    });

    it('should throw error on failure', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(BiometricService.disableBiometric()).rejects.toThrow(
        'Failed to disable biometric authentication'
      );
    });
  });

  describe('authenticateWithBiometric', () => {
    beforeEach(() => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('true') // biometric enabled
        .mockResolvedValueOnce('user-123'); // user ID
    });

    it('should authenticate successfully', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await BiometricService.authenticateWithBiometric();

      expect(result).toEqual({
        success: true,
        userId: 'user-123',
      });
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to access Next Chapter',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
    });

    it('should handle authentication failure', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      const result = await BiometricService.authenticateWithBiometric();

      expect(result).toEqual({
        success: false,
        error: 'Authentication cancelled',
      });
    });

    it('should handle non-cancel authentication failure', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'unknown',
      });

      const result = await BiometricService.authenticateWithBiometric();

      expect(result).toEqual({
        success: false,
        error: 'Authentication failed',
      });
    });

    it('should return error when biometric not supported', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const result = await BiometricService.authenticateWithBiometric();

      expect(result).toEqual({
        success: false,
        error: 'Biometric authentication is not available on this device',
      });
    });

    it('should return error when biometric not enabled', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('false');

      const result = await BiometricService.authenticateWithBiometric();

      expect(result).toEqual({
        success: false,
        error: 'Biometric authentication is not enabled',
      });
    });
  });

  describe('promptForBiometricEnrollment', () => {
    it('should enroll successfully', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true,
      });
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await BiometricService.promptForBiometricEnrollment('user-123');

      expect(result).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@next_chapter/biometric_enabled', 'true');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@next_chapter/biometric_user', 'user-123');
    });

    it('should return false when authentication fails', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
      });

      const result = await BiometricService.promptForBiometricEnrollment('user-123');

      expect(result).toBe(false);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should return false when biometric not supported', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);

      const result = await BiometricService.promptForBiometricEnrollment('user-123');

      expect(result).toBe(false);
    });
  });

  describe('getBiometricTypeString', () => {
    it('should return Face ID for iOS facial recognition', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      jest.spyOn(require('react-native').Platform, 'OS', 'get').mockReturnValue('ios');

      const result = await BiometricService.getBiometricTypeString();

      expect(result).toBe('Face ID');
    });

    it('should return Touch ID for iOS fingerprint', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
      jest.spyOn(require('react-native').Platform, 'OS', 'get').mockReturnValue('ios');

      const result = await BiometricService.getBiometricTypeString();

      expect(result).toBe('Touch ID');
    });

    it('should return Face Recognition for Android facial recognition', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);
      jest.spyOn(require('react-native').Platform, 'OS', 'get').mockReturnValue('android');

      const result = await BiometricService.getBiometricTypeString();

      expect(result).toBe('Face Recognition');
    });

    it('should return Fingerprint for Android fingerprint', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);
      jest.spyOn(require('react-native').Platform, 'OS', 'get').mockReturnValue('android');

      const result = await BiometricService.getBiometricTypeString();

      expect(result).toBe('Fingerprint');
    });

    it('should return Iris Recognition for iris authentication', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.IRIS,
      ]);

      const result = await BiometricService.getBiometricTypeString();

      expect(result).toBe('Iris Recognition');
    });

    it('should return default string when no specific type', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([]);

      const result = await BiometricService.getBiometricTypeString();

      expect(result).toBe('Biometric Authentication');
    });
  });
});