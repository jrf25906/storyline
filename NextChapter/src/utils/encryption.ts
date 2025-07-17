import CryptoJS from 'crypto-js';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENCRYPTION_KEY_SERVICE = 'next_chapter_encryption';
const ENCRYPTION_KEY_USERNAME = 'encryption_key';
const SALT_KEY = '@next_chapter/encryption_salt';

/**
 * Get or create an encryption key stored securely in the device keychain
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key from keychain
    const credentials = await Keychain.getInternetCredentials(ENCRYPTION_KEY_SERVICE);
    
    if (credentials) {
      return credentials.password;
    }
    
    // Generate new key if none exists
    const newKey = CryptoJS.lib.WordArray.random(256/8).toString();
    
    // Store in keychain
    await Keychain.setInternetCredentials(
      ENCRYPTION_KEY_SERVICE,
      ENCRYPTION_KEY_USERNAME,
      newKey
    );
    
    return newKey;
  } catch (error) {
    console.error('Failed to access keychain, falling back to less secure storage', error);
    
    // Fallback to AsyncStorage (less secure but better than nothing)
    const storedKey = await AsyncStorage.getItem('@next_chapter/fallback_encryption_key');
    if (storedKey) {
      return storedKey;
    }
    
    const newKey = CryptoJS.lib.WordArray.random(256/8).toString();
    await AsyncStorage.setItem('@next_chapter/fallback_encryption_key', newKey);
    return newKey;
  }
}

/**
 * Get or create a salt for additional security
 */
async function getOrCreateSalt(): Promise<string> {
  const storedSalt = await AsyncStorage.getItem(SALT_KEY);
  
  if (storedSalt) {
    return storedSalt;
  }
  
  const newSalt = CryptoJS.lib.WordArray.random(128/8).toString();
  await AsyncStorage.setItem(SALT_KEY, newSalt);
  return newSalt;
}

/**
 * Encrypt sensitive data using AES-256
 */
export async function encryptData(data: any): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    const salt = await getOrCreateSalt();
    
    // Convert data to string
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Create a key with salt
    const keyWithSalt = CryptoJS.PBKDF2(key, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    
    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(dataString, keyWithSalt.toString());
    
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data
 */
export async function decryptData(encryptedData: string): Promise<any> {
  try {
    const key = await getOrCreateEncryptionKey();
    const salt = await getOrCreateSalt();
    
    // Create a key with salt
    const keyWithSalt = CryptoJS.PBKDF2(key, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyWithSalt.toString());
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Try to parse as JSON, return as string if fails
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, cannot be decrypted)
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Encrypt specific budget fields
 */
export async function encryptBudgetData(budgetData: any): Promise<any> {
  const sensitiveFields = [
    'monthlyIncome',
    'currentSavings',
    'monthlyExpenses',
    'severanceAmount'
  ];
  
  const encryptedData = { ...budgetData };
  
  for (const field of sensitiveFields) {
    if (budgetData[field] !== undefined && budgetData[field] !== null) {
      encryptedData[field] = await encryptData(budgetData[field]);
    }
  }
  
  return encryptedData;
}

/**
 * Decrypt budget data
 */
export async function decryptBudgetData(encryptedBudgetData: any): Promise<any> {
  const sensitiveFields = [
    'monthlyIncome',
    'currentSavings',
    'monthlyExpenses',
    'severanceAmount'
  ];
  
  const decryptedData = { ...encryptedBudgetData };
  
  for (const field of sensitiveFields) {
    if (encryptedBudgetData[field] && typeof encryptedBudgetData[field] === 'string') {
      try {
        decryptedData[field] = await decryptData(encryptedBudgetData[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Leave as encrypted if decryption fails
      }
    }
  }
  
  return decryptedData;
}

/**
 * Clear encryption keys (for logout/data deletion)
 */
export async function clearEncryptionKeys(): Promise<void> {
  try {
    await Keychain.resetInternetCredentials({ server: ENCRYPTION_KEY_SERVICE });
  } catch (error) {
    console.error('Failed to clear keychain:', error);
  }
  
  // Clear fallback key and salt
  await AsyncStorage.multiRemove([
    '@next_chapter/fallback_encryption_key',
    SALT_KEY
  ]);
}