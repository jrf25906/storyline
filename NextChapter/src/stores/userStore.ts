/**
 * Temporary compatibility layer for userStore migration
 * This file re-exports the refactored store while maintaining backward compatibility
 * 
 * TODO: Remove this file after all components have been updated to import from refactored/userStore
 */
export { useUserStore } from './refactored/userStore';

// Re-export types for backward compatibility
export type { IUserStore as UserStore } from './interfaces/userStore';