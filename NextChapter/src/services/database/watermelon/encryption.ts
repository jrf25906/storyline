import CryptoJS from 'crypto-js';
import * as Keychain from 'react-native-keychain';

const ENCRYPTION_KEY_SERVICE = 'com.nextchapter.encryption';
const ENCRYPTION_KEY_USERNAME = 'encryption_key';

// Generate or retrieve encryption key
async function getEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key
    const credentials = await Keychain.getInternetCredentials(ENCRYPTION_KEY_SERVICE);
    
    if (credentials && credentials.password) {
      return credentials.password;
    }
    
    // Generate new key if not exists
    const newKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
    
    // Store key securely
    await Keychain.setInternetCredentials(
      ENCRYPTION_KEY_SERVICE,
      ENCRYPTION_KEY_USERNAME,
      newKey
    );
    
    return newKey;
  } catch (error) {
    console.error('Error managing encryption key:', error);
    // Fallback to a deterministic key (less secure but ensures app functionality)
    return 'fallback-encryption-key-should-be-replaced';
  }
}

// Encrypt data
export async function encryptData(data: any): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data
export async function decryptData(encryptedData: string): Promise<any> {
  try {
    const key = await getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Hash data (one-way, for sensitive data that should never be decrypted)
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

// Encrypt specific financial fields
export async function encryptFinancialData(data: {
  amount?: number;
  accountNumber?: string;
  routingNumber?: string;
  [key: string]: any;
}): Promise<any> {
  const encrypted = { ...data };
  
  // Encrypt sensitive fields
  if (data.amount !== undefined) {
    encrypted.amount = await encryptData(data.amount);
  }
  
  if (data.accountNumber) {
    encrypted.accountNumber = await encryptData(data.accountNumber);
  }
  
  if (data.routingNumber) {
    encrypted.routingNumber = await encryptData(data.routingNumber);
  }
  
  return encrypted;
}

// Decrypt specific financial fields
export async function decryptFinancialData(data: {
  amount?: string;
  accountNumber?: string;
  routingNumber?: string;
  [key: string]: any;
}): Promise<any> {
  const decrypted = { ...data };
  
  // Decrypt sensitive fields
  if (data.amount && typeof data.amount === 'string') {
    decrypted.amount = await decryptData(data.amount);
  }
  
  if (data.accountNumber && typeof data.accountNumber === 'string') {
    decrypted.accountNumber = await decryptData(data.accountNumber);
  }
  
  if (data.routingNumber && typeof data.routingNumber === 'string') {
    decrypted.routingNumber = await decryptData(data.routingNumber);
  }
  
  return decrypted;
}

// Clear encryption key (for logout/data deletion)
export async function clearEncryptionKey(): Promise<void> {
  try {
    await Keychain.resetInternetCredentials(ENCRYPTION_KEY_SERVICE);
  } catch (error) {
    console.error('Error clearing encryption key:', error);
  }
}