/**
 * Key management service for secure credential storage
 */

import { Result } from '@services/interfaces/common/result';

export interface IKeyManagementService {
  // API key management
  setApiKey(service: string, key: string): Promise<Result<void>>;
  getApiKey(service: string): Promise<Result<string | null>>;
  removeApiKey(service: string): Promise<Result<void>>;
  hasApiKey(service: string): Promise<Result<boolean>>;
  listApiKeyServices(): Promise<Result<string[]>>;
  
  // Secure credential storage
  setCredentials(identifier: string, credentials: Credentials): Promise<Result<void>>;
  getCredentials(identifier: string): Promise<Result<Credentials | null>>;
  removeCredentials(identifier: string): Promise<Result<void>>;
  
  // Token management
  setToken(type: TokenType, token: string, metadata?: TokenMetadata): Promise<Result<void>>;
  getToken(type: TokenType): Promise<Result<TokenInfo | null>>;
  removeToken(type: TokenType): Promise<Result<void>>;
  refreshToken(type: TokenType): Promise<Result<string>>;
  
  // Encryption keys
  storeMasterKey(key: string): Promise<Result<void>>;
  getMasterKey(): Promise<Result<string | null>>;
  rotateMasterKey(): Promise<Result<string>>;
  
  // Certificate management
  storeCertificate(name: string, certificate: Certificate): Promise<Result<void>>;
  getCertificate(name: string): Promise<Result<Certificate | null>>;
  removeCertificate(name: string): Promise<Result<void>>;
  
  // Secure environment
  getSecureEnvironment(): Promise<Result<SecureEnvironment>>;
  isSecureEnvironment(): boolean;
  
  // Key rotation
  scheduleKeyRotation(service: string, intervalDays: number): Promise<Result<void>>;
  getKeyRotationSchedule(): Promise<Result<KeyRotationSchedule[]>>;
  
  // Audit
  getKeyAccessLog(service: string): Promise<Result<KeyAccessLog[]>>;
  clearKeyAccessLog(): Promise<Result<void>>;
}

export interface Credentials {
  username: string;
  password: string;
  metadata?: Record<string, any>;
}

export type TokenType = 
  | 'access'
  | 'refresh'
  | 'api'
  | 'push'
  | 'oauth';

export interface TokenInfo {
  token: string;
  type: TokenType;
  expiresAt?: Date;
  metadata?: TokenMetadata;
}

export interface TokenMetadata {
  issuer?: string;
  audience?: string;
  scope?: string[];
  [key: string]: any;
}

export interface Certificate {
  cert: string;
  key?: string;
  ca?: string;
  passphrase?: string;
  expiresAt: Date;
}

export interface SecureEnvironment {
  isRooted: boolean;
  isDebuggable: boolean;
  isEmulator: boolean;
  hasSecureHardware: boolean;
  integrityVerified: boolean;
}

export interface KeyRotationSchedule {
  service: string;
  lastRotated: Date;
  nextRotation: Date;
  intervalDays: number;
  autoRotate: boolean;
}

export interface KeyAccessLog {
  service: string;
  action: 'read' | 'write' | 'delete';
  timestamp: Date;
  success: boolean;
  error?: string;
}