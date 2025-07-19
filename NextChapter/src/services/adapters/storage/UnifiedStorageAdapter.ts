/**
 * Unified storage adapter implementing all storage interfaces
 * Combines AsyncStorage, SecureStore, FileSystem, and DocumentPicker
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { 
  IStorageService, 
  SecureStorageOptions,
  FileInfo,
  DocumentPickerOptions,
  DocumentResult,
  StorageInfo,
  StorageOptimizationResult
} from '@services/interfaces/data/IStorageService';
import { Result, ok, err, tryCatch } from '@services/interfaces/common/result';
import { StorageError, StorageLimitError } from '@services/interfaces/common/errors';

export class UnifiedStorageAdapter implements IStorageService {
  private readonly prefix: string;
  private storageListeners: Array<(info: StorageInfo) => void> = [];
  private storageCheckInterval: NodeJS.Timeout | null = null;
  
  // Storage limits in bytes
  private readonly SOFT_LIMIT = 20 * 1024 * 1024; // 20MB
  private readonly HARD_LIMIT = 25 * 1024 * 1024; // 25MB

  constructor(prefix: string = '@next_chapter/') {
    this.prefix = prefix;
    this.startStorageMonitoring();
  }

  // IKeyValueStorage implementation
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T = string>(key: string): Promise<Result<T | null>> {
    return tryCatch(
      async () => {
        const value = await AsyncStorage.getItem(this.getKey(key));
        if (value === null) return null;
        
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      },
      (error) => new StorageError(`Failed to get key ${key}: ${error}`)
    );
  }

  async set<T = string>(key: string, value: T): Promise<Result<void>> {
    // Check storage limits before writing
    const spaceCheck = await this.checkStorageSpace();
    if (spaceCheck.isErr()) return spaceCheck;

    return tryCatch(
      async () => {
        const stringValue = typeof value === 'string' 
          ? value 
          : JSON.stringify(value);
        
        await AsyncStorage.setItem(this.getKey(key), stringValue);
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to set key ${key}: ${error}`)
    );
  }

  async remove(key: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        await AsyncStorage.removeItem(this.getKey(key));
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to remove key ${key}: ${error}`)
    );
  }

  async clear(): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const keys = await AsyncStorage.getAllKeys();
        const prefixedKeys = keys.filter(k => k.startsWith(this.prefix));
        await AsyncStorage.multiRemove(prefixedKeys);
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to clear storage: ${error}`)
    );
  }

  async getAllKeys(): Promise<Result<string[]>> {
    return tryCatch(
      async () => {
        const keys = await AsyncStorage.getAllKeys();
        return keys
          .filter(k => k.startsWith(this.prefix))
          .map(k => k.substring(this.prefix.length));
      },
      (error) => new StorageError(`Failed to get all keys: ${error}`)
    );
  }

  async multiGet<T = string>(keys: string[]): Promise<Result<Array<[string, T | null]>>> {
    return tryCatch(
      async () => {
        const prefixedKeys = keys.map(k => this.getKey(k));
        const results = await AsyncStorage.multiGet(prefixedKeys);
        
        return results.map(([key, value]) => {
          const unprefixedKey = key.substring(this.prefix.length);
          if (value === null) return [unprefixedKey, null];
          
          try {
            return [unprefixedKey, JSON.parse(value) as T];
          } catch {
            return [unprefixedKey, value as T];
          }
        });
      },
      (error) => new StorageError(`Failed to multi-get: ${error}`)
    );
  }

  async multiSet<T = string>(pairs: Array<[string, T]>): Promise<Result<void>> {
    // Check storage limits before writing
    const spaceCheck = await this.checkStorageSpace();
    if (spaceCheck.isErr()) return spaceCheck;

    return tryCatch(
      async () => {
        const prefixedPairs = pairs.map(([key, value]) => {
          const stringValue = typeof value === 'string' 
            ? value 
            : JSON.stringify(value);
          return [this.getKey(key), stringValue] as [string, string];
        });
        
        await AsyncStorage.multiSet(prefixedPairs);
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to multi-set: ${error}`)
    );
  }

  async multiRemove(keys: string[]): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const prefixedKeys = keys.map(k => this.getKey(k));
        await AsyncStorage.multiRemove(prefixedKeys);
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to multi-remove: ${error}`)
    );
  }

  // ISecureStorage implementation
  async getSecureItem(key: string, options?: SecureStorageOptions): Promise<Result<string | null>> {
    return tryCatch(
      async () => {
        const result = await SecureStore.getItemAsync(this.getKey(key), {
          requireAuthentication: options?.requireAuthentication,
          authenticationPrompt: options?.authenticationPrompt,
          keychainAccessible: this.mapAccessible(options?.accessible)
        });
        return result;
      },
      (error) => new StorageError(`Failed to get secure item ${key}: ${error}`)
    );
  }

  async setSecureItem(key: string, value: string, options?: SecureStorageOptions): Promise<Result<void>> {
    return tryCatch(
      async () => {
        await SecureStore.setItemAsync(this.getKey(key), value, {
          requireAuthentication: options?.requireAuthentication,
          authenticationPrompt: options?.authenticationPrompt,
          keychainAccessible: this.mapAccessible(options?.accessible)
        });
      },
      (error) => new StorageError(`Failed to set secure item ${key}: ${error}`)
    );
  }

  async removeSecureItem(key: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        await SecureStore.deleteItemAsync(this.getKey(key));
      },
      (error) => new StorageError(`Failed to remove secure item ${key}: ${error}`)
    );
  }

  async hasSecureItem(key: string): Promise<Result<boolean>> {
    const result = await this.getSecureItem(key);
    if (result.isErr()) return result;
    return ok(result.value !== null);
  }

  // IFileStorage implementation
  async readFile(path: string): Promise<Result<string>> {
    return tryCatch(
      async () => {
        const uri = this.getFilePath(path);
        return await FileSystem.readAsStringAsync(uri);
      },
      (error) => new StorageError(`Failed to read file ${path}: ${error}`)
    );
  }

  async writeFile(path: string, content: string): Promise<Result<void>> {
    // Check storage limits before writing
    const spaceCheck = await this.checkStorageSpace();
    if (spaceCheck.isErr()) return spaceCheck;

    return tryCatch(
      async () => {
        const uri = this.getFilePath(path);
        await FileSystem.writeAsStringAsync(uri, content);
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to write file ${path}: ${error}`)
    );
  }

  async deleteFile(path: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const uri = this.getFilePath(path);
        await FileSystem.deleteAsync(uri);
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to delete file ${path}: ${error}`)
    );
  }

  async exists(path: string): Promise<Result<boolean>> {
    return tryCatch(
      async () => {
        const uri = this.getFilePath(path);
        const info = await FileSystem.getInfoAsync(uri);
        return info.exists;
      },
      (error) => new StorageError(`Failed to check file existence ${path}: ${error}`)
    );
  }

  async getInfo(path: string): Promise<Result<FileInfo>> {
    return tryCatch(
      async () => {
        const uri = this.getFilePath(path);
        const info = await FileSystem.getInfoAsync(uri);
        
        if (!info.exists) {
          throw new Error(`File not found: ${path}`);
        }

        return {
          size: info.size || 0,
          modificationTime: new Date(info.modificationTime || Date.now()),
          isDirectory: info.isDirectory || false,
          uri: info.uri
        };
      },
      (error) => new StorageError(`Failed to get file info ${path}: ${error}`)
    );
  }

  async makeDirectory(path: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const uri = this.getFilePath(path);
        await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
      },
      (error) => new StorageError(`Failed to make directory ${path}: ${error}`)
    );
  }

  async readDirectory(path: string): Promise<Result<string[]>> {
    return tryCatch(
      async () => {
        const uri = this.getFilePath(path);
        return await FileSystem.readDirectoryAsync(uri);
      },
      (error) => new StorageError(`Failed to read directory ${path}: ${error}`)
    );
  }

  async copyFile(source: string, destination: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const sourceUri = this.getFilePath(source);
        const destUri = this.getFilePath(destination);
        await FileSystem.copyAsync({ from: sourceUri, to: destUri });
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to copy file ${source} to ${destination}: ${error}`)
    );
  }

  async moveFile(source: string, destination: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const sourceUri = this.getFilePath(source);
        const destUri = this.getFilePath(destination);
        await FileSystem.moveAsync({ from: sourceUri, to: destUri });
        await this.notifyStorageChange();
      },
      (error) => new StorageError(`Failed to move file ${source} to ${destination}: ${error}`)
    );
  }

  // IDocumentStorage implementation
  async pickDocument(options?: DocumentPickerOptions): Promise<Result<DocumentResult>> {
    return tryCatch(
      async () => {
        const result = await DocumentPicker.getDocumentAsync({
          type: options?.type || '*/*',
          copyToCacheDirectory: options?.copyToCacheDirectory ?? true,
          multiple: options?.multiple ?? false
        });

        if (result.type === 'cancel') {
          throw new Error('Document selection cancelled');
        }

        return {
          uri: result.uri,
          name: result.name,
          size: result.size,
          mimeType: result.mimeType
        };
      },
      (error) => new StorageError(`Failed to pick document: ${error}`)
    );
  }

  async saveDocument(uri: string, destPath: string): Promise<Result<string>> {
    return tryCatch(
      async () => {
        const destUri = this.getFilePath(destPath);
        await FileSystem.copyAsync({ from: uri, to: destUri });
        await this.notifyStorageChange();
        return destUri;
      },
      (error) => new StorageError(`Failed to save document: ${error}`)
    );
  }

  async getDocumentText(uri: string): Promise<Result<string>> {
    return tryCatch(
      async () => {
        return await FileSystem.readAsStringAsync(uri);
      },
      (error) => new StorageError(`Failed to read document text: ${error}`)
    );
  }

  async deleteDocument(path: string): Promise<Result<void>> {
    return this.deleteFile(path);
  }

  // IStorageMonitor implementation
  async getUsedSpace(): Promise<Result<number>> {
    return tryCatch(
      async () => {
        // Get all AsyncStorage data
        const keys = await AsyncStorage.getAllKeys();
        let totalSize = 0;

        for (const key of keys) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }

        // Add file system usage
        const documentsDir = FileSystem.documentDirectory;
        if (documentsDir) {
          const info = await FileSystem.getInfoAsync(documentsDir);
          if (info.exists && info.size) {
            totalSize += info.size;
          }
        }

        return totalSize;
      },
      (error) => new StorageError(`Failed to get used space: ${error}`)
    );
  }

  async getAvailableSpace(): Promise<Result<number>> {
    return tryCatch(
      async () => {
        const diskInfo = await FileSystem.getFreeDiskStorageAsync();
        return diskInfo;
      },
      (error) => new StorageError(`Failed to get available space: ${error}`)
    );
  }

  async getTotalSpace(): Promise<Result<number>> {
    return tryCatch(
      async () => {
        const diskInfo = await FileSystem.getTotalDiskCapacityAsync();
        return diskInfo;
      },
      (error) => new StorageError(`Failed to get total space: ${error}`)
    );
  }

  async isStorageLow(): Promise<Result<boolean>> {
    const usedResult = await this.getUsedSpace();
    if (usedResult.isErr()) return usedResult;

    return ok(usedResult.value >= this.SOFT_LIMIT);
  }

  onStorageChange(callback: (info: StorageInfo) => void): () => void {
    this.storageListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.storageListeners.indexOf(callback);
      if (index > -1) {
        this.storageListeners.splice(index, 1);
      }
    };
  }

  // Cleanup operations
  async clearExpiredData(): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const keys = await AsyncStorage.getAllKeys();
        const expiredKeys: string[] = [];
        const now = Date.now();

        for (const key of keys) {
          if (key.includes('_expiry_')) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
              const expiry = parseInt(value);
              if (expiry < now) {
                expiredKeys.push(key);
                // Also remove the associated data key
                expiredKeys.push(key.replace('_expiry_', ''));
              }
            }
          }
        }

        if (expiredKeys.length > 0) {
          await AsyncStorage.multiRemove(expiredKeys);
          await this.notifyStorageChange();
        }
      },
      (error) => new StorageError(`Failed to clear expired data: ${error}`)
    );
  }

  async optimizeStorage(): Promise<Result<StorageOptimizationResult>> {
    return tryCatch(
      async () => {
        const startTime = Date.now();
        let spaceSaved = 0;
        let itemsRemoved = 0;

        // Clear expired data
        await this.clearExpiredData();

        // Clear old coach conversations (keep last 90 days)
        const conversationKeys = await this.findKeysByPattern('coach/conversation/');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        for (const key of conversationKeys) {
          const dataResult = await this.get<any>(key);
          if (dataResult.isOk() && dataResult.value) {
            const conversations = Array.isArray(dataResult.value) ? dataResult.value : [];
            const filtered = conversations.filter((c: any) => 
              new Date(c.updatedAt) > cutoffDate
            );
            
            if (filtered.length < conversations.length) {
              await this.set(key, filtered);
              itemsRemoved += conversations.length - filtered.length;
            }
          }
        }

        // Clear old mood entries (keep last 180 days)
        const moodKeys = await this.findKeysByPattern('mood/');
        const moodCutoff = new Date();
        moodCutoff.setDate(moodCutoff.getDate() - 180);

        for (const key of moodKeys) {
          const dataResult = await this.get<any>(key);
          if (dataResult.isOk() && dataResult.value) {
            const date = new Date(dataResult.value.createdAt);
            if (date < moodCutoff) {
              await this.remove(key);
              itemsRemoved++;
            }
          }
        }

        // Calculate space saved
        const endUsedSpace = await this.getUsedSpace();
        if (endUsedSpace.isOk()) {
          spaceSaved = Math.max(0, spaceSaved - endUsedSpace.value);
        }

        await this.notifyStorageChange();

        return {
          spaceSaved,
          itemsRemoved,
          duration: Date.now() - startTime
        };
      },
      (error) => new StorageError(`Failed to optimize storage: ${error}`)
    );
  }

  // Helper methods
  private getFilePath(path: string): string {
    return `${FileSystem.documentDirectory}${this.prefix}${path}`;
  }

  private mapAccessible(accessible?: string): number {
    switch (accessible) {
      case 'afterFirstUnlock':
        return SecureStore.AFTER_FIRST_UNLOCK;
      case 'whenUnlocked':
        return SecureStore.WHEN_UNLOCKED;
      case 'whenPasscodeSetThisDeviceOnly':
        return SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
      default:
        return SecureStore.WHEN_UNLOCKED;
    }
  }

  private async checkStorageSpace(): Promise<Result<void>> {
    const usedResult = await this.getUsedSpace();
    if (usedResult.isErr()) return usedResult;

    const used = usedResult.value;
    if (used >= this.HARD_LIMIT) {
      return err(new StorageLimitError(used, this.HARD_LIMIT));
    }

    return ok(undefined);
  }

  private async notifyStorageChange(): Promise<void> {
    if (this.storageListeners.length === 0) return;

    const [used, available, total] = await Promise.all([
      this.getUsedSpace(),
      this.getAvailableSpace(),
      this.getTotalSpace()
    ]);

    const info: StorageInfo = {
      usedSpace: used.isOk() ? used.value : 0,
      availableSpace: available.isOk() ? available.value : 0,
      totalSpace: total.isOk() ? total.value : 0,
      percentUsed: 0
    };

    if (info.totalSpace > 0) {
      info.percentUsed = (info.usedSpace / info.totalSpace) * 100;
    }

    this.storageListeners.forEach(listener => listener(info));
  }

  private async findKeysByPattern(pattern: string): Promise<string[]> {
    const keysResult = await this.getAllKeys();
    if (keysResult.isErr()) return [];

    return keysResult.value.filter(key => key.includes(pattern));
  }

  private startStorageMonitoring(): void {
    // Check storage every 5 minutes
    this.storageCheckInterval = setInterval(async () => {
      await this.notifyStorageChange();
      
      // Auto-optimize if storage is low
      const isLowResult = await this.isStorageLow();
      if (isLowResult.isOk() && isLowResult.value) {
        await this.optimizeStorage();
      }
    }, 5 * 60 * 1000);
  }

  destroy(): void {
    if (this.storageCheckInterval) {
      clearInterval(this.storageCheckInterval);
      this.storageCheckInterval = null;
    }
    this.storageListeners = [];
  }
}