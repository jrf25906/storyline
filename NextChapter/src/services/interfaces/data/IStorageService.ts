/**
 * Storage service interfaces for different storage needs
 * Following Single Responsibility Principle
 */

import { Result } from '@services/interfaces/common/result';

// Key-value storage (AsyncStorage wrapper)
export interface IKeyValueStorage {
  get<T = string>(key: string): Promise<Result<T | null>>;
  set<T = string>(key: string, value: T): Promise<Result<void>>;
  remove(key: string): Promise<Result<void>>;
  clear(): Promise<Result<void>>;
  getAllKeys(): Promise<Result<string[]>>;
  multiGet<T = string>(keys: string[]): Promise<Result<Array<[string, T | null]>>>;
  multiSet<T = string>(pairs: Array<[string, T]>): Promise<Result<void>>;
  multiRemove(keys: string[]): Promise<Result<void>>;
}

// Secure storage (Keychain/SecureStore wrapper)
export interface ISecureStorage {
  getSecureItem(key: string, options?: SecureStorageOptions): Promise<Result<string | null>>;
  setSecureItem(key: string, value: string, options?: SecureStorageOptions): Promise<Result<void>>;
  removeSecureItem(key: string): Promise<Result<void>>;
  hasSecureItem(key: string): Promise<Result<boolean>>;
}

export interface SecureStorageOptions {
  accessible?: 'afterFirstUnlock' | 'whenUnlocked' | 'whenPasscodeSetThisDeviceOnly';
  authenticationPrompt?: string;
  requireAuthentication?: boolean;
}

// File storage
export interface IFileStorage {
  readFile(path: string): Promise<Result<string>>;
  writeFile(path: string, content: string): Promise<Result<void>>;
  deleteFile(path: string): Promise<Result<void>>;
  exists(path: string): Promise<Result<boolean>>;
  getInfo(path: string): Promise<Result<FileInfo>>;
  makeDirectory(path: string): Promise<Result<void>>;
  readDirectory(path: string): Promise<Result<string[]>>;
  copyFile(source: string, destination: string): Promise<Result<void>>;
  moveFile(source: string, destination: string): Promise<Result<void>>;
}

export interface FileInfo {
  size: number;
  modificationTime: Date;
  isDirectory: boolean;
  uri: string;
}

// Document storage (for resumes, etc)
export interface IDocumentStorage {
  pickDocument(options?: DocumentPickerOptions): Promise<Result<DocumentResult>>;
  saveDocument(uri: string, destPath: string): Promise<Result<string>>;
  getDocumentText(uri: string): Promise<Result<string>>;
  deleteDocument(path: string): Promise<Result<void>>;
}

export interface DocumentPickerOptions {
  type?: string[];
  copyToCacheDirectory?: boolean;
  multiple?: boolean;
}

export interface DocumentResult {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

// Storage monitoring
export interface IStorageMonitor {
  getUsedSpace(): Promise<Result<number>>;
  getAvailableSpace(): Promise<Result<number>>;
  getTotalSpace(): Promise<Result<number>>;
  isStorageLow(): Promise<Result<boolean>>;
  onStorageChange(callback: (info: StorageInfo) => void): () => void;
}

export interface StorageInfo {
  usedSpace: number;
  availableSpace: number;
  totalSpace: number;
  percentUsed: number;
}

// Combined storage service
export interface IStorageService extends 
  IKeyValueStorage,
  ISecureStorage,
  IFileStorage,
  IDocumentStorage,
  IStorageMonitor {
  
  // Cleanup operations
  clearExpiredData(): Promise<Result<void>>;
  optimizeStorage(): Promise<Result<StorageOptimizationResult>>;
}

export interface StorageOptimizationResult {
  spaceSaved: number;
  itemsRemoved: number;
  duration: number;
}