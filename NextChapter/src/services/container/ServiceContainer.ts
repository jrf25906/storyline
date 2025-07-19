import { Result, AppError, ErrorType } from '@services/interfaces/common';
import { IAuthService } from '@services/interfaces/IAuthService';
import { IAIService } from '@services/interfaces/IAIService';
import { IDataService, BaseEntity, IDataServiceFactory } from '@services/interfaces/IDataService';

/**
 * Service registration entry
 */
interface ServiceRegistration {
  factory: () => any;
  singleton: boolean;
  instance?: any;
}

/**
 * Service types enum for type-safe registration
 */
export enum ServiceType {
  AUTH = 'AUTH',
  AI = 'AI',
  DATA_FACTORY = 'DATA_FACTORY',
  NOTIFICATION = 'NOTIFICATION',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  ANALYTICS = 'ANALYTICS',
  CRASH = 'CRASH',
}

/**
 * Service container for dependency injection
 * Implements singleton pattern for service management
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, ServiceRegistration> = new Map();
  private dataServices: Map<string, IDataService<any>> = new Map();
  private initialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service
   */
  register<T>(
    type: ServiceType | string,
    factory: () => T,
    options: { singleton?: boolean } = { singleton: true }
  ): void {
    if (this.services.has(type)) {
      console.warn(`Service ${type} is already registered. Overwriting.`);
    }

    this.services.set(type, {
      factory,
      singleton: options.singleton ?? true,
    });
  }

  /**
   * Get a service instance
   */
  get<T>(type: ServiceType | string): T {
    const registration = this.services.get(type);
    
    if (!registration) {
      throw new Error(`Service ${type} is not registered`);
    }

    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      return registration.instance;
    }

    return registration.factory();
  }

  /**
   * Get or throw with Result type
   */
  async getAsync<T>(type: ServiceType | string): Promise<Result<T>> {
    try {
      const service = this.get<T>(type);
      return { success: true, data: service };
    } catch (error) {
      return {
        success: false,
        error: new AppError(
          ErrorType.NOT_FOUND,
          `Service ${type} not found`,
          { serviceType: type }
        ),
      };
    }
  }

  /**
   * Type-safe getters for core services
   */
  getAuthService(): IAuthService {
    return this.get<IAuthService>(ServiceType.AUTH);
  }

  getAIService(): IAIService {
    return this.get<IAIService>(ServiceType.AI);
  }

  getDataServiceFactory(): IDataServiceFactory {
    return this.get<IDataServiceFactory>(ServiceType.DATA_FACTORY);
  }

  /**
   * Get a data service for a specific entity
   */
  getDataService<T extends BaseEntity>(entityName: string): IDataService<T> {
    if (!this.dataServices.has(entityName)) {
      const factory = this.getDataServiceFactory();
      const service = factory.createService<T>(entityName);
      this.dataServices.set(entityName, service);
    }
    return this.dataServices.get(entityName) as IDataService<T>;
  }

  /**
   * Check if a service is registered
   */
  has(type: ServiceType | string): boolean {
    return this.services.has(type);
  }

  /**
   * Initialize all registered services
   */
  async initialize(): Promise<Result<void>> {
    if (this.initialized) {
      return { success: true, data: undefined };
    }

    try {
      // Initialize services that have initialize method
      for (const [type, registration] of this.services.entries()) {
        if (registration.singleton && !registration.instance) {
          registration.instance = registration.factory();
        }

        const service = registration.instance || registration.factory();
        
        // Check if service has initialize method
        if (service && typeof service.initialize === 'function') {
          const result = await service.initialize();
          if (!result.success) {
            return {
              success: false,
              error: new AppError(
                ErrorType.UNKNOWN_ERROR,
                `Failed to initialize service ${type}`,
                { serviceType: type, originalError: result.error }
              ),
            };
          }
        }
      }

      // Initialize data services
      const dataFactory = this.getDataServiceFactory();
      const result = await dataFactory.initializeAll();
      if (!result.success) {
        return result;
      }

      this.initialized = true;
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: AppError.from(error),
      };
    }
  }

  /**
   * Dispose all services
   */
  async dispose(): Promise<void> {
    // Dispose data services first
    for (const [_, service] of this.dataServices) {
      if (service && typeof service.dispose === 'function') {
        await service.dispose();
      }
    }
    this.dataServices.clear();

    // Dispose registered services
    for (const [_, registration] of this.services) {
      if (registration.instance && typeof registration.instance.dispose === 'function') {
        await registration.instance.dispose();
      }
    }
    
    this.services.clear();
    this.initialized = false;
  }

  /**
   * Reset the container (for testing)
   */
  reset(): void {
    this.services.clear();
    this.dataServices.clear();
    this.initialized = false;
  }

  /**
   * Get all registered service types (for debugging)
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Create a scoped container (for testing or isolated contexts)
   */
  createScope(): ServiceContainer {
    const scopedContainer = new ServiceContainer();
    
    // Copy service registrations but not instances
    for (const [type, registration] of this.services) {
      scopedContainer.services.set(type, {
        factory: registration.factory,
        singleton: registration.singleton,
      });
    }
    
    return scopedContainer;
  }
}

/**
 * Convenience function to get container instance
 */
export const getServiceContainer = (): ServiceContainer => {
  return ServiceContainer.getInstance();
};

/**
 * Service registration decorator (for future use)
 */
export function Injectable(type: ServiceType | string, options?: { singleton?: boolean }) {
  return function (target: any) {
    ServiceContainer.getInstance().register(type, () => new target(), options);
    return target;
  };
}

/**
 * Property injection decorator (for future use)
 */
export function Inject(type: ServiceType | string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get() {
        return ServiceContainer.getInstance().get(type);
      },
      enumerable: true,
      configurable: true,
    });
  };
}