/**
 * Encryption service interface for data security
 */

import { Result } from '@services/interfaces/common/result';

export interface IEncryptionService {
  // Symmetric encryption
  encrypt(data: string, key?: string): Promise<Result<EncryptedData>>;
  decrypt(encryptedData: EncryptedData, key?: string): Promise<Result<string>>;
  
  // Binary data
  encryptBinary(data: ArrayBuffer, key?: string): Promise<Result<EncryptedBinary>>;
  decryptBinary(encryptedData: EncryptedBinary, key?: string): Promise<Result<ArrayBuffer>>;
  
  // Key management
  generateKey(algorithm?: EncryptionAlgorithm): Promise<Result<string>>;
  deriveKey(password: string, salt?: string): Promise<Result<DerivedKey>>;
  
  // Hashing
  hash(data: string, algorithm?: HashAlgorithm): Promise<Result<string>>;
  hashWithSalt(data: string, salt?: string): Promise<Result<HashedData>>;
  verifyHash(data: string, hash: string, salt?: string): Promise<Result<boolean>>;
  
  // Digital signatures
  sign(data: string, privateKey: string): Promise<Result<string>>;
  verify(data: string, signature: string, publicKey: string): Promise<Result<boolean>>;
  
  // Key pair generation
  generateKeyPair(algorithm?: AsymmetricAlgorithm): Promise<Result<KeyPair>>;
  
  // Secure random
  generateRandomBytes(length: number): Promise<Result<ArrayBuffer>>;
  generateRandomString(length: number, charset?: string): Promise<Result<string>>;
  
  // Utilities
  encodeBase64(data: ArrayBuffer | string): string;
  decodeBase64(data: string): ArrayBuffer;
  constantTimeCompare(a: string, b: string): boolean;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  algorithm: string;
  authTag?: string;
}

export interface EncryptedBinary {
  ciphertext: ArrayBuffer;
  iv: ArrayBuffer;
  algorithm: string;
  authTag?: ArrayBuffer;
}

export interface DerivedKey {
  key: string;
  salt: string;
  iterations: number;
  algorithm: string;
}

export interface HashedData {
  hash: string;
  salt: string;
  algorithm: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: string;
}

export type EncryptionAlgorithm = 
  | 'AES-256-GCM'
  | 'AES-256-CBC'
  | 'ChaCha20-Poly1305';

export type HashAlgorithm = 
  | 'SHA-256'
  | 'SHA-384'
  | 'SHA-512'
  | 'SHA3-256'
  | 'SHA3-512';

export type AsymmetricAlgorithm = 
  | 'RSA-2048'
  | 'RSA-4096'
  | 'ECDSA-P256'
  | 'ECDSA-P384'
  | 'Ed25519';

// Field-level encryption
export interface IFieldEncryption {
  encryptField(value: any, fieldName: string): Promise<Result<string>>;
  decryptField(encryptedValue: string, fieldName: string): Promise<Result<any>>;
  encryptObject<T extends object>(obj: T, fields: (keyof T)[]): Promise<Result<T>>;
  decryptObject<T extends object>(obj: T, fields: (keyof T)[]): Promise<Result<T>>;
}