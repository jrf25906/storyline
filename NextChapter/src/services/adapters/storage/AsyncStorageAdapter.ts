/**
 * AsyncStorage adapter implementing IKeyValueStorage
 * Example of Adapter Pattern and Dependency Inversion Principle
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { IKeyValueStorage } from '@services/interfaces/data/IStorageService';
import { Result, ok, err, tryCatch } from '@services/interfaces/common/result';
import { StorageError } from '@services/interfaces/common/errors';

export class AsyncStorageAdapter implements IKeyValueStorage {
  private readonly prefix: string;

  constructor(prefix: string = '@next_chapter/') {
    this.prefix = prefix;
  }

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
    return tryCatch(
      async () => {
        const stringValue = typeof value === 'string' 
          ? value 
          : JSON.stringify(value);
        
        await AsyncStorage.setItem(this.getKey(key), stringValue);
      },
      (error) => new StorageError(`Failed to set key ${key}: ${error}`)
    );
  }

  async remove(key: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        await AsyncStorage.removeItem(this.getKey(key));
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
    return tryCatch(
      async () => {
        const prefixedPairs = pairs.map(([key, value]) => {
          const stringValue = typeof value === 'string' 
            ? value 
            : JSON.stringify(value);
          return [this.getKey(key), stringValue] as [string, string];
        });
        
        await AsyncStorage.multiSet(prefixedPairs);
      },
      (error) => new StorageError(`Failed to multi-set: ${error}`)
    );
  }

  async multiRemove(keys: string[]): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const prefixedKeys = keys.map(k => this.getKey(k));
        await AsyncStorage.multiRemove(prefixedKeys);
      },
      (error) => new StorageError(`Failed to multi-remove: ${error}`)
    );
  }
}