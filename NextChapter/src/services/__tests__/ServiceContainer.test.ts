import { ServiceContainer } from '@services/ServiceContainer';
import {
  createMockAuthService,
  createMockAIService,
  createMockStorageService,
  createMockAnalyticsService,
  createMockNetworkService,
  createMockSyncService,
  createMockEncryptionService,
} from '@test-utils';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    // Reset singleton instance
    (ServiceContainer as any).instance = null;
    container = ServiceContainer.getInstance();
  });

  afterEach(() => {
    // Clean up
    (ServiceContainer as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ServiceContainer.getInstance();
      const instance2 = ServiceContainer.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain service references across calls', () => {
      const mockAuth = createMockAuthService();
      container.registerService('auth', mockAuth);

      const newReference = ServiceContainer.getInstance();
      expect(newReference.getService('auth')).toBe(mockAuth);
    });
  });

  describe('Service Registration', () => {
    it('should register and retrieve services', () => {
      const mockAuth = createMockAuthService();
      const mockAI = createMockAIService();

      container.registerService('auth', mockAuth);
      container.registerService('ai', mockAI);

      expect(container.getService('auth')).toBe(mockAuth);
      expect(container.getService('ai')).toBe(mockAI);
    });

    it('should throw error when retrieving unregistered service', () => {
      expect(() => {
        container.getService('nonexistent');
      }).toThrow('Service nonexistent not found');
    });

    it('should allow overriding existing services', () => {
      const mockAuth1 = createMockAuthService();
      const mockAuth2 = createMockAuthService();

      container.registerService('auth', mockAuth1);
      expect(container.getService('auth')).toBe(mockAuth1);

      container.registerService('auth', mockAuth2);
      expect(container.getService('auth')).toBe(mockAuth2);
    });

    it('should register multiple services at once', () => {
      const services = {
        auth: createMockAuthService(),
        ai: createMockAIService(),
        storage: createMockStorageService(),
      };

      container.registerServices(services);

      expect(container.getService('auth')).toBe(services.auth);
      expect(container.getService('ai')).toBe(services.ai);
      expect(container.getService('storage')).toBe(services.storage);
    });
  });

  describe('Service Dependencies', () => {
    it('should support services with dependencies', () => {
      const mockStorage = createMockStorageService();
      const mockEncryption = createMockEncryptionService();

      // Simulate a service that depends on other services
      class SecureStorageService {
        constructor(
          private storage: typeof mockStorage,
          private encryption: typeof mockEncryption
        ) {}

        async secureSet(key: string, value: any) {
          const encrypted = await this.encryption.encrypt(JSON.stringify(value));
          return this.storage.set(key, encrypted.value!);
        }
      }

      container.registerService('storage', mockStorage);
      container.registerService('encryption', mockEncryption);

      const secureStorage = new SecureStorageService(
        container.getService('storage'),
        container.getService('encryption')
      );

      container.registerService('secureStorage', secureStorage);

      expect(container.getService('secureStorage')).toBe(secureStorage);
    });
  });

  describe('Service Lifecycle', () => {
    it('should check if service is registered', () => {
      const mockAuth = createMockAuthService();
      
      expect(container.hasService('auth')).toBe(false);
      
      container.registerService('auth', mockAuth);
      
      expect(container.hasService('auth')).toBe(true);
    });

    it('should remove services', () => {
      const mockAuth = createMockAuthService();
      
      container.registerService('auth', mockAuth);
      expect(container.hasService('auth')).toBe(true);
      
      container.removeService('auth');
      expect(container.hasService('auth')).toBe(false);
    });

    it('should clear all services', () => {
      container.registerServices({
        auth: createMockAuthService(),
        ai: createMockAIService(),
        storage: createMockStorageService(),
      });

      expect(container.hasService('auth')).toBe(true);
      expect(container.hasService('ai')).toBe(true);
      expect(container.hasService('storage')).toBe(true);

      container.clearServices();

      expect(container.hasService('auth')).toBe(false);
      expect(container.hasService('ai')).toBe(false);
      expect(container.hasService('storage')).toBe(false);
    });
  });

  describe('Service Factory Pattern', () => {
    it('should support lazy service initialization', () => {
      let initCount = 0;
      
      const lazyServiceFactory = () => {
        initCount++;
        return createMockAuthService();
      };

      container.registerFactory('auth', lazyServiceFactory);

      expect(initCount).toBe(0);

      const service1 = container.getService('auth');
      expect(initCount).toBe(1);

      const service2 = container.getService('auth');
      expect(initCount).toBe(1); // Should not reinitialize
      expect(service1).toBe(service2);
    });

    it('should support transient services', () => {
      let createCount = 0;
      
      const transientFactory = () => {
        createCount++;
        return { id: createCount };
      };

      container.registerFactory('transient', transientFactory, { transient: true });

      const service1 = container.getService('transient');
      const service2 = container.getService('transient');

      expect(service1).not.toBe(service2);
      expect(service1.id).toBe(1);
      expect(service2.id).toBe(2);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type information for services', () => {
      const mockAuth = createMockAuthService();
      container.registerService('auth', mockAuth);

      const retrievedAuth = container.getService<typeof mockAuth>('auth');
      
      // TypeScript should recognize these methods
      expect(retrievedAuth.signIn).toBeDefined();
      expect(retrievedAuth.signOut).toBeDefined();
      expect(retrievedAuth.getCurrentUser).toBeDefined();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize all default services', async () => {
      const mockServices = {
        auth: createMockAuthService(),
        ai: createMockAIService(),
        storage: createMockStorageService(),
        analytics: createMockAnalyticsService(),
        network: createMockNetworkService(),
        sync: createMockSyncService(),
        encryption: createMockEncryptionService(),
      };

      await container.initializeServices(mockServices);

      expect(container.hasService('auth')).toBe(true);
      expect(container.hasService('ai')).toBe(true);
      expect(container.hasService('storage')).toBe(true);
      expect(container.hasService('analytics')).toBe(true);
      expect(container.hasService('network')).toBe(true);
      expect(container.hasService('sync')).toBe(true);
      expect(container.hasService('encryption')).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      const failingService = {
        initialize: jest.fn().mockRejectedValue(new Error('Init failed')),
      };

      container.registerService('failing', failingService);

      await expect(container.initializeService('failing')).rejects.toThrow('Init failed');
    });
  });

  describe('Service Decorators', () => {
    it('should support service decorators for cross-cutting concerns', () => {
      const mockAnalytics = createMockAnalyticsService();
      const mockAuth = createMockAuthService();

      // Decorate auth service with analytics
      const decoratedAuth = new Proxy(mockAuth, {
        get(target, prop) {
          const original = target[prop as keyof typeof target];
          
          if (typeof original === 'function') {
            return async (...args: any[]) => {
              mockAnalytics.track('service_method_called', {
                service: 'auth',
                method: String(prop),
              });
              
              return original.apply(target, args);
            };
          }
          
          return original;
        },
      });

      container.registerService('analytics', mockAnalytics);
      container.registerService('auth', decoratedAuth);

      const auth = container.getService('auth');
      auth.signIn('user@example.com', 'password');

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'service_method_called',
        expect.objectContaining({
          service: 'auth',
          method: 'signIn',
        })
      );
    });
  });

  describe('Testing Support', () => {
    it('should support test mode with mock services', () => {
      const testContainer = ServiceContainer.createTestInstance();

      const mockAuth = createMockAuthService();
      testContainer.registerService('auth', mockAuth);

      expect(testContainer).not.toBe(ServiceContainer.getInstance());
      expect(testContainer.getService('auth')).toBe(mockAuth);
    });

    it('should reset to clean state for tests', () => {
      container.registerService('auth', createMockAuthService());
      expect(container.hasService('auth')).toBe(true);

      container.reset();
      expect(container.hasService('auth')).toBe(false);
    });
  });
});