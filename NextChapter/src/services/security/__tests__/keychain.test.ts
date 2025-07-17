import { KeychainService } from '../keychain';
import * as Keychain from 'react-native-keychain';

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(),
  getInternetCredentials: jest.fn(),
  resetInternetCredentials: jest.fn(),
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BiometryCurrentSet',
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
  },
  AUTHENTICATION_TYPE: {
    BIOMETRICS: 'AuthenticationWithBiometrics',
  },
  STORAGE_TYPE: {
    AES_GCM_NO_AUTH: 'KeystoreAESGCMNoAuth',
  },
}));

describe('KeychainService', () => {
  let keychainService: KeychainService;

  beforeEach(() => {
    keychainService = new KeychainService();
    jest.clearAllMocks();
  });

  describe('setSecureValue', () => {
    it('should store a value securely with proper access control', async () => {
      const mockSetCredentials = Keychain.setInternetCredentials as jest.MockedFunction<
        typeof Keychain.setInternetCredentials
      >;
      mockSetCredentials.mockResolvedValue({
        service: 'com.nextchapter.app',
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const key = 'SUPABASE_URL';
      const value = 'https://myproject.supabase.co';

      await keychainService.setSecureValue(key, value);

      expect(mockSetCredentials).toHaveBeenCalledWith(
        'com.nextchapter.app',
        key,
        value,
        {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        }
      );
    });

    it('should throw an error if storage fails', async () => {
      const mockSetCredentials = Keychain.setInternetCredentials as jest.MockedFunction<
        typeof Keychain.setInternetCredentials
      >;
      mockSetCredentials.mockResolvedValue(false);

      const key = 'API_KEY';
      const value = 'test-key';

      await expect(keychainService.setSecureValue(key, value)).rejects.toThrow(
        'Failed to store secure value for key: API_KEY'
      );
    });

    it('should handle network errors gracefully', async () => {
      const mockSetCredentials = Keychain.setInternetCredentials as jest.MockedFunction<
        typeof Keychain.setInternetCredentials
      >;
      mockSetCredentials.mockRejectedValue(new Error('Network error'));

      const key = 'API_KEY';
      const value = 'test-key';

      await expect(keychainService.setSecureValue(key, value)).rejects.toThrow(
        'Failed to store secure value for key: API_KEY'
      );
    });

    it('should not store empty values', async () => {
      await expect(keychainService.setSecureValue('KEY', '')).rejects.toThrow(
        'Cannot store empty value for key: KEY'
      );
    });

    it('should not store values with empty keys', async () => {
      await expect(keychainService.setSecureValue('', 'value')).rejects.toThrow(
        'Key cannot be empty'
      );
    });
  });

  describe('getSecureValue', () => {
    it('should retrieve a stored value', async () => {
      const mockGetCredentials = Keychain.getInternetCredentials as jest.MockedFunction<
        typeof Keychain.getInternetCredentials
      >;
      mockGetCredentials.mockResolvedValue({
        username: 'SUPABASE_URL',
        password: 'https://myproject.supabase.co',
        service: 'com.nextchapter.app',
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const value = await keychainService.getSecureValue('SUPABASE_URL');
      expect(value).toBe('https://myproject.supabase.co');
      expect(mockGetCredentials).toHaveBeenCalledWith('com.nextchapter.app');
    });

    it('should return null if no value is found', async () => {
      const mockGetCredentials = Keychain.getInternetCredentials as jest.MockedFunction<
        typeof Keychain.getInternetCredentials
      >;
      mockGetCredentials.mockResolvedValue(false);

      const value = await keychainService.getSecureValue('NON_EXISTENT_KEY');
      expect(value).toBeNull();
    });

    it('should handle retrieval errors gracefully', async () => {
      const mockGetCredentials = Keychain.getInternetCredentials as jest.MockedFunction<
        typeof Keychain.getInternetCredentials
      >;
      mockGetCredentials.mockRejectedValue(new Error('Keychain access denied'));

      await expect(keychainService.getSecureValue('API_KEY')).rejects.toThrow(
        'Failed to retrieve secure value for key: API_KEY'
      );
    });

    it('should handle empty key parameter', async () => {
      await expect(keychainService.getSecureValue('')).rejects.toThrow(
        'Key cannot be empty'
      );
    });
  });

  describe('removeSecureValue', () => {
    it('should remove a stored value', async () => {
      const mockResetCredentials = Keychain.resetInternetCredentials as jest.MockedFunction<
        typeof Keychain.resetInternetCredentials
      >;
      mockResetCredentials.mockResolvedValue(undefined);

      await keychainService.removeSecureValue('API_KEY');
      expect(mockResetCredentials).toHaveBeenCalledWith('com.nextchapter.app');
    });

    it('should handle removal errors gracefully', async () => {
      const mockResetCredentials = Keychain.resetInternetCredentials as jest.MockedFunction<
        typeof Keychain.resetInternetCredentials
      >;
      mockResetCredentials.mockRejectedValue(new Error('Reset failed'));

      await expect(keychainService.removeSecureValue('API_KEY')).rejects.toThrow(
        'Failed to remove secure value for key: API_KEY'
      );
    });
  });

  describe('hasSecureValue', () => {
    it('should return true if value exists', async () => {
      const mockGetCredentials = Keychain.getInternetCredentials as jest.MockedFunction<
        typeof Keychain.getInternetCredentials
      >;
      mockGetCredentials.mockResolvedValue({
        username: 'API_KEY',
        password: 'test-value',
        service: 'com.nextchapter.app',
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const exists = await keychainService.hasSecureValue('API_KEY');
      expect(exists).toBe(true);
    });

    it('should return false if value does not exist', async () => {
      const mockGetCredentials = Keychain.getInternetCredentials as jest.MockedFunction<
        typeof Keychain.getInternetCredentials
      >;
      mockGetCredentials.mockResolvedValue(false);

      const exists = await keychainService.hasSecureValue('NON_EXISTENT');
      expect(exists).toBe(false);
    });
  });

  describe('setMultipleSecureValues', () => {
    it('should store multiple values atomically', async () => {
      const mockSetCredentials = Keychain.setInternetCredentials as jest.MockedFunction<
        typeof Keychain.setInternetCredentials
      >;
      mockSetCredentials.mockResolvedValue({
        service: 'com.nextchapter.app',
        storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
      });

      const values = {
        SUPABASE_URL: 'https://myproject.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        OPENAI_API_KEY: 'test-openai-key',
      };

      await keychainService.setMultipleSecureValues(values);

      expect(mockSetCredentials).toHaveBeenCalledTimes(3);
      expect(mockSetCredentials).toHaveBeenCalledWith(
        'com.nextchapter.app',
        'SUPABASE_URL',
        'https://myproject.supabase.co',
        expect.any(Object)
      );
    });

    it('should rollback all values if one fails', async () => {
      const mockSetCredentials = Keychain.setInternetCredentials as jest.MockedFunction<
        typeof Keychain.setInternetCredentials
      >;
      const mockResetCredentials = Keychain.resetInternetCredentials as jest.MockedFunction<
        typeof Keychain.resetInternetCredentials
      >;

      // First two succeed, third fails
      mockSetCredentials
        .mockResolvedValueOnce({
          service: 'com.nextchapter.app',
          storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        })
        .mockResolvedValueOnce({
          service: 'com.nextchapter.app',
          storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        })
        .mockResolvedValueOnce(false);
      mockResetCredentials.mockResolvedValue(undefined);

      const values = {
        KEY1: 'value1',
        KEY2: 'value2',
        KEY3: 'value3',
      };

      await expect(keychainService.setMultipleSecureValues(values)).rejects.toThrow(
        'Failed to store all secure values, rolling back'
      );

      // Should have attempted to remove the successful ones
      expect(mockResetCredentials).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMultipleSecureValues', () => {
    it('should retrieve multiple values', async () => {
      const mockGetCredentials = Keychain.getInternetCredentials as jest.MockedFunction<
        typeof Keychain.getInternetCredentials
      >;

      // Mock different responses for each key
      mockGetCredentials
        .mockResolvedValueOnce({
          username: 'SUPABASE_URL',
          password: 'https://myproject.supabase.co',
          service: 'com.nextchapter.app',
          storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        })
        .mockResolvedValueOnce({
          username: 'SUPABASE_ANON_KEY',
          password: 'test-anon-key',
          service: 'com.nextchapter.app',
          storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
        })
        .mockResolvedValueOnce(false); // NON_EXISTENT

      const values = await keychainService.getMultipleSecureValues([
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'NON_EXISTENT',
      ]);

      expect(values).toEqual({
        SUPABASE_URL: 'https://myproject.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon-key',
        NON_EXISTENT: null,
      });
    });
  });

  describe('clearAllSecureValues', () => {
    it('should clear all stored values', async () => {
      const mockResetCredentials = Keychain.resetInternetCredentials as jest.MockedFunction<
        typeof Keychain.resetInternetCredentials
      >;
      mockResetCredentials.mockResolvedValue(undefined);

      await keychainService.clearAllSecureValues();
      expect(mockResetCredentials).toHaveBeenCalledWith('com.nextchapter.app');
    });
  });
});