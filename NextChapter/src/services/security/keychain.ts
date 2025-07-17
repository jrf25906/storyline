import * as Keychain from 'react-native-keychain';

/**
 * Service for secure storage of sensitive data using iOS Keychain and Android Keystore
 * Implements SOLID principles with single responsibility for secure storage
 */
export class KeychainService {
  private readonly serviceName = 'com.nextchapter.app';

  /**
   * Store a value securely with biometric protection
   */
  async setSecureValue(key: string, value: string): Promise<void> {
    if (!key) {
      throw new Error('Key cannot be empty');
    }

    if (!value) {
      throw new Error(`Cannot store empty value for key: ${key}`);
    }

    try {
      const result = await Keychain.setInternetCredentials(
        this.serviceName,
        key,
        value,
        {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        }
      );

      if (!result) {
        throw new Error(`Failed to store secure value for key: ${key}`);
      }
    } catch (error) {
      // Re-throw with consistent error message
      throw new Error(`Failed to store secure value for key: ${key}`);
    }
  }

  /**
   * Retrieve a value from secure storage
   */
  async getSecureValue(key: string): Promise<string | null> {
    if (!key) {
      throw new Error('Key cannot be empty');
    }

    try {
      const credentials = await Keychain.getInternetCredentials(this.serviceName);
      
      if (!credentials) {
        return null;
      }

      // Check if this is the key we're looking for
      if (credentials.username === key) {
        return credentials.password;
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to retrieve secure value for key: ${key}`);
    }
  }

  /**
   * Remove a value from secure storage
   */
  async removeSecureValue(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials({ server: this.serviceName });
    } catch (error) {
      throw new Error(`Failed to remove secure value for key: ${key}`);
    }
  }

  /**
   * Check if a value exists in secure storage
   */
  async hasSecureValue(key: string): Promise<boolean> {
    const value = await this.getSecureValue(key);
    return value !== null;
  }

  /**
   * Store multiple values atomically with rollback on failure
   */
  async setMultipleSecureValues(values: Record<string, string>): Promise<void> {
    const keys = Object.keys(values);
    const storedKeys: string[] = [];

    try {
      for (const key of keys) {
        await this.setSecureValue(key, values[key]);
        storedKeys.push(key);
      }
    } catch (error) {
      // Rollback: remove all successfully stored keys
      for (const key of storedKeys) {
        try {
          await this.removeSecureValue(key);
        } catch {
          // Ignore rollback errors
        }
      }
      throw new Error('Failed to store all secure values, rolling back');
    }
  }

  /**
   * Retrieve multiple values from secure storage
   */
  async getMultipleSecureValues(
    keys: string[]
  ): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};

    for (const key of keys) {
      try {
        result[key] = await this.getSecureValue(key);
      } catch {
        result[key] = null;
      }
    }

    return result;
  }

  /**
   * Clear all values from secure storage
   */
  async clearAllSecureValues(): Promise<void> {
    await Keychain.resetInternetCredentials({ server: this.serviceName });
  }
}