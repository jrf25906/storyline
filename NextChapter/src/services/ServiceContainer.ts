/**
 * Service Container for Dependency Injection
 * Implements Inversion of Control pattern
 */

import { 
  IAuthService,
  IBiometricService,
  IStorageService,
  IDataService,
  IChatCompletionService,
  ICoachService,
  INotificationService,
  IAnalyticsService,
  INetworkService,
  ISyncService,
  IEncryptionService,
  IKeyManagementService
} from '@services/interfaces';

export interface ServiceDefinition {
  factory: () => any;
  singleton?: boolean;
  eager?: boolean;
}

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  // Service registration
  register<T>(name: string, factory: () => T, options?: { singleton?: boolean; eager?: boolean }): void {
    this.services.set(name, {
      factory,
      singleton: options?.singleton ?? true,
      eager: options?.eager ?? false
    });

    // Eagerly instantiate if requested
    if (options?.eager && options?.singleton) {
      this.resolve<T>(name);
    }
  }

  // Service resolution
  resolve<T>(name: string): T {
    const definition = this.services.get(name);
    if (!definition) {
      throw new Error(`Service '${name}' not registered`);
    }

    if (definition.singleton) {
      if (!this.instances.has(name)) {
        this.instances.set(name, definition.factory());
      }
      return this.instances.get(name);
    }

    return definition.factory();
  }

  // Typed getters for common services
  get auth(): IAuthService {
    return this.resolve<IAuthService>('auth');
  }

  get biometric(): IBiometricService {
    return this.resolve<IBiometricService>('biometric');
  }

  get storage(): IStorageService {
    return this.resolve<IStorageService>('storage');
  }

  get chat(): IChatCompletionService {
    return this.resolve<IChatCompletionService>('chat');
  }

  get coach(): ICoachService {
    return this.resolve<ICoachService>('coach');
  }

  get notifications(): INotificationService {
    return this.resolve<INotificationService>('notifications');
  }

  get analytics(): IAnalyticsService {
    return this.resolve<IAnalyticsService>('analytics');
  }

  get network(): INetworkService {
    return this.resolve<INetworkService>('network');
  }

  get sync(): ISyncService {
    return this.resolve<ISyncService>('sync');
  }

  get encryption(): IEncryptionService {
    return this.resolve<IEncryptionService>('encryption');
  }

  get keyManager(): IKeyManagementService {
    return this.resolve<IKeyManagementService>('keyManager');
  }

  // Data service factory
  dataService<T>(entityName: string): IDataService<T> {
    return this.resolve<IDataService<T>>(`data.${entityName}`);
  }

  // Reset container (useful for testing)
  reset(): void {
    this.instances.clear();
    this.services.clear();
  }

  // Check if service is registered
  has(name: string): boolean {
    return this.services.has(name);
  }

  // Get all registered service names
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// Singleton instance getter
export const services = ServiceContainer.getInstance();