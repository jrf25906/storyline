/**
 * Main export for services module
 */

// Export all interfaces
export * from './interfaces';

// Export container and related utilities
export {
  ServiceContainer,
  ServiceType,
  getServiceContainer,
  Injectable,
  Inject,
} from './container/ServiceContainer';