/**
 * Session management service interface
 */

import { Result } from '@services/interfaces/common/result';

export interface ISessionService {
  // Session lifecycle
  createSession(userId: string, metadata?: SessionMetadata): Promise<Result<Session>>;
  getSession(sessionId: string): Promise<Result<Session | null>>;
  getCurrentSession(): Promise<Result<Session | null>>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<Result<Session>>;
  destroySession(sessionId: string): Promise<Result<void>>;
  destroyAllSessions(userId: string): Promise<Result<void>>;
  
  // Session validation
  validateSession(sessionId: string): Promise<Result<boolean>>;
  isSessionExpired(session: Session): boolean;
  extendSession(sessionId: string, duration?: number): Promise<Result<Session>>;
  
  // Multi-device support
  listActiveSessions(userId: string): Promise<Result<Session[]>>;
  getSessionCount(userId: string): Promise<Result<number>>;
  
  // Activity tracking
  updateLastActivity(sessionId: string): Promise<Result<void>>;
  getInactiveSessions(inactiveMinutes: number): Promise<Result<Session[]>>;
  
  // Security
  rotateSessionId(oldSessionId: string): Promise<Result<Session>>;
  flagSuspiciousActivity(sessionId: string, reason: string): Promise<Result<void>>;
  
  // Events
  onSessionExpired(callback: (session: Session) => void): () => void;
  onSessionCreated(callback: (session: Session) => void): () => void;
  onSessionDestroyed(callback: (sessionId: string) => void): () => void;
}

export interface Session {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: SessionMetadata;
  flags?: SessionFlags;
}

export interface DeviceInfo {
  id: string;
  name?: string;
  platform: 'ios' | 'android' | 'web';
  osVersion?: string;
  appVersion?: string;
  model?: string;
  manufacturer?: string;
}

export interface SessionMetadata {
  loginMethod?: 'password' | 'biometric' | 'social' | 'magic_link';
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
  [key: string]: any;
}

export interface SessionFlags {
  suspicious?: boolean;
  requiresReauth?: boolean;
  readOnly?: boolean;
}