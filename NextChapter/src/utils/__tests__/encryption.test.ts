import CryptoJS from 'crypto-js';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  encryptData,
  decryptData,
  hashData,
  encryptBudgetData,
  decryptBudgetData,
  clearEncryptionKeys,
} from '@utils/encryption';

// Mock dependencies
jest.mock('crypto-js');
jest.mock('react-native-keychain');
jest.mock('@react-native-async-storage/async-storage');

describe('encryption utilities', () => {
  const mockKey = 'test-encryption-key';
  const mockSalt = 'test-salt';
  const mockEncrypted = 'encrypted-data';
  const mockWordArray = { toString: jest.fn(() => mockKey) };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock CryptoJS
    (CryptoJS.lib.WordArray.random as jest.Mock) = jest.fn().mockReturnValue(mockWordArray);
    (CryptoJS.PBKDF2 as jest.Mock) = jest.fn().mockReturnValue({ toString: () => 'derived-key' });
    (CryptoJS.AES.encrypt as jest.Mock) = jest.fn().mockReturnValue({ toString: () => mockEncrypted });
    (CryptoJS.AES.decrypt as jest.Mock) = jest.fn().mockReturnValue({
      toString: jest.fn(() => JSON.stringify({ test: 'data' })),
    });
    (CryptoJS.SHA256 as jest.Mock) = jest.fn().mockReturnValue({ toString: () => 'hashed-data' });

    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

    // Mock Keychain
    (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue(null);
    (Keychain.setInternetCredentials as jest.Mock).mockResolvedValue(true);
    (Keychain.resetInternetCredentials as jest.Mock).mockResolvedValue(true);
  });

  describe('encryptData', () => {
    it('should encrypt string data', async () => {
      const data = 'sensitive information';
      const result = await encryptData(data);

      expect(result).toBe(mockEncrypted);
      expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(data, 'derived-key');
    });

    it('should encrypt object data as JSON', async () => {
      const data = { username: 'test', password: 'secret' };
      const result = await encryptData(data);

      expect(result).toBe(mockEncrypted);
      expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(JSON.stringify(data), 'derived-key');
    });

    it('should create new encryption key if none exists', async () => {
      await encryptData('test');

      expect(Keychain.getInternetCredentials).toHaveBeenCalledWith('next_chapter_encryption');
      expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(
        'next_chapter_encryption',
        'encryption_key',
        mockKey
      );
    });

    it('should use existing encryption key from keychain', async () => {
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue({
        password: 'existing-key',
      });

      await encryptData('test');

      expect(Keychain.setInternetCredentials).not.toHaveBeenCalled();
      expect(CryptoJS.PBKDF2).toHaveBeenCalledWith('existing-key', expect.any(String), {
        keySize: 256 / 32,
        iterations: 1000,
      });
    });

    it('should create salt if none exists', async () => {
      await encryptData('test');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@next_chapter/encryption_salt');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@next_chapter/encryption_salt', mockKey);
    });

    it('should use existing salt', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@next_chapter/encryption_salt') return Promise.resolve('existing-salt');
        return Promise.resolve(null);
      });

      await encryptData('test');

      expect(CryptoJS.PBKDF2).toHaveBeenCalledWith(expect.any(String), 'existing-salt', {
        keySize: 256 / 32,
        iterations: 1000,
      });
    });

    it('should fall back to AsyncStorage if keychain fails', async () => {
      (Keychain.getInternetCredentials as jest.Mock).mockRejectedValue(new Error('Keychain error'));

      await encryptData('test');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@next_chapter/fallback_encryption_key');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/fallback_encryption_key',
        mockKey
      );
    });

    it('should throw error if encryption fails', async () => {
      (CryptoJS.AES.encrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Encryption error');
      });

      await expect(encryptData('test')).rejects.toThrow('Failed to encrypt data');
    });
  });

  describe('decryptData', () => {
    beforeEach(() => {
      (Keychain.getInternetCredentials as jest.Mock).mockResolvedValue({
        password: mockKey,
      });
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === '@next_chapter/encryption_salt') return Promise.resolve(mockSalt);
        return Promise.resolve(null);
      });
    });

    it('should decrypt to object when data is JSON', async () => {
      const mockDecrypted = { toString: jest.fn(() => '{"test":"data"}') };
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(mockDecrypted);

      const result = await decryptData(mockEncrypted);

      expect(result).toEqual({ test: 'data' });
      expect(CryptoJS.AES.decrypt).toHaveBeenCalledWith(mockEncrypted, 'derived-key');
    });

    it('should decrypt to string when data is not JSON', async () => {
      const mockDecrypted = { toString: jest.fn(() => 'plain text') };
      (CryptoJS.AES.decrypt as jest.Mock).mockReturnValue(mockDecrypted);

      const result = await decryptData(mockEncrypted);

      expect(result).toBe('plain text');
    });

    it('should use same key derivation as encryption', async () => {
      await decryptData(mockEncrypted);

      expect(CryptoJS.PBKDF2).toHaveBeenCalledWith(mockKey, mockSalt, {
        keySize: 256 / 32,
        iterations: 1000,
      });
    });

    it('should throw error if decryption fails', async () => {
      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption error');
      });

      await expect(decryptData(mockEncrypted)).rejects.toThrow('Failed to decrypt data');
    });
  });

  describe('hashData', () => {
    it('should hash data using SHA256', () => {
      const data = 'sensitive-data';
      const result = hashData(data);

      expect(result).toBe('hashed-data');
      expect(CryptoJS.SHA256).toHaveBeenCalledWith(data);
    });

    it('should produce consistent hash for same input', () => {
      const data = 'test-data';
      const hash1 = hashData(data);
      const hash2 = hashData(data);

      expect(hash1).toBe(hash2);
    });
  });

  describe('encryptBudgetData', () => {
    const mockBudgetData = {
      monthlyIncome: 5000,
      currentSavings: 10000,
      monthlyExpenses: 3000,
      severanceAmount: 15000,
      otherField: 'not encrypted',
    };

    beforeEach(() => {
      let encryptCallCount = 0;
      (CryptoJS.AES.encrypt as jest.Mock).mockImplementation(() => ({
        toString: () => `encrypted-${encryptCallCount++}`,
      }));
    });

    it('should encrypt sensitive budget fields', async () => {
      const result = await encryptBudgetData(mockBudgetData);

      expect(result.monthlyIncome).toBe('encrypted-0');
      expect(result.currentSavings).toBe('encrypted-1');
      expect(result.monthlyExpenses).toBe('encrypted-2');
      expect(result.severanceAmount).toBe('encrypted-3');
      expect(result.otherField).toBe('not encrypted');
    });

    it('should handle missing fields gracefully', async () => {
      const partialData = {
        monthlyIncome: 5000,
        otherField: 'test',
      };

      const result = await encryptBudgetData(partialData);

      expect(result.monthlyIncome).toBe('encrypted-0');
      expect(result.otherField).toBe('test');
      expect(result.currentSavings).toBeUndefined();
    });

    it('should skip null and undefined values', async () => {
      const dataWithNulls = {
        monthlyIncome: null,
        currentSavings: undefined,
        monthlyExpenses: 3000,
      };

      const result = await encryptBudgetData(dataWithNulls);

      expect(result.monthlyIncome).toBeNull();
      expect(result.currentSavings).toBeUndefined();
      expect(result.monthlyExpenses).toBe('encrypted-0');
    });
  });

  describe('decryptBudgetData', () => {
    const mockEncryptedBudget = {
      monthlyIncome: 'encrypted-income',
      currentSavings: 'encrypted-savings',
      monthlyExpenses: 'encrypted-expenses',
      severanceAmount: 'encrypted-severance',
      otherField: 'not encrypted',
    };

    beforeEach(() => {
      const decryptMap: Record<string, any> = {
        'encrypted-income': 5000,
        'encrypted-savings': 10000,
        'encrypted-expenses': 3000,
        'encrypted-severance': 15000,
      };

      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation((data) => ({
        toString: jest.fn(() => JSON.stringify(decryptMap[data] || data)),
      }));
    });

    it('should decrypt sensitive budget fields', async () => {
      const result = await decryptBudgetData(mockEncryptedBudget);

      expect(result.monthlyIncome).toBe(5000);
      expect(result.currentSavings).toBe(10000);
      expect(result.monthlyExpenses).toBe(3000);
      expect(result.severanceAmount).toBe(15000);
      expect(result.otherField).toBe('not encrypted');
    });

    it('should handle decryption errors gracefully', async () => {
      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await decryptBudgetData(mockEncryptedBudget);

      // Should leave fields as encrypted if decryption fails
      expect(result.monthlyIncome).toBe('encrypted-income');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to decrypt field monthlyIncome:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should skip non-string values', async () => {
      const mixedData = {
        monthlyIncome: 5000, // Already decrypted number
        currentSavings: 'encrypted-savings',
        otherField: { nested: 'object' },
      };

      const result = await decryptBudgetData(mixedData);

      expect(result.monthlyIncome).toBe(5000);
      expect(result.currentSavings).toBe(10000);
      expect(result.otherField).toEqual({ nested: 'object' });
    });
  });

  describe('clearEncryptionKeys', () => {
    it('should clear keychain credentials', async () => {
      await clearEncryptionKeys();

      expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith({
        server: 'next_chapter_encryption',
      });
    });

    it('should clear AsyncStorage keys', async () => {
      await clearEncryptionKeys();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@next_chapter/fallback_encryption_key',
        '@next_chapter/encryption_salt',
      ]);
    });

    it('should handle keychain errors gracefully', async () => {
      (Keychain.resetInternetCredentials as jest.Mock).mockRejectedValue(
        new Error('Keychain error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await clearEncryptionKeys();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear keychain:', expect.any(Error));
      expect(AsyncStorage.multiRemove).toHaveBeenCalled(); // Should still clear AsyncStorage

      consoleSpy.mockRestore();
    });
  });

  describe('Security Best Practices', () => {
    it('should use strong key derivation with PBKDF2', async () => {
      await encryptData('test');

      expect(CryptoJS.PBKDF2).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        {
          keySize: 256 / 32, // 256-bit key
          iterations: 1000, // Sufficient iterations for mobile
        }
      );
    });

    it('should generate cryptographically secure random keys', async () => {
      await encryptData('test');

      expect(CryptoJS.lib.WordArray.random).toHaveBeenCalledWith(256 / 8); // 256 bits
    });

    it('should generate unique salt', async () => {
      await encryptData('test');

      expect(CryptoJS.lib.WordArray.random).toHaveBeenCalledWith(128 / 8); // 128 bits for salt
    });

    it('should not expose sensitive data in error messages', async () => {
      const sensitiveData = 'user-password-12345';
      (CryptoJS.AES.encrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      try {
        await encryptData(sensitiveData);
      } catch (error: any) {
        expect(error.message).not.toContain(sensitiveData);
        expect(error.message).toBe('Failed to encrypt data');
      }
    });
  });
});