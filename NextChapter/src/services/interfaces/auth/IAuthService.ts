/**
 * Authentication service interfaces
 */

import { Result } from '@services/interfaces/common/result';

export interface IAuthService {
  // Authentication
  signUp(credentials: SignUpCredentials): Promise<Result<AuthSession>>;
  signIn(credentials: SignInCredentials): Promise<Result<AuthSession>>;
  signOut(): Promise<Result<void>>;
  
  // Session management
  getCurrentSession(): Promise<Result<AuthSession | null>>;
  refreshSession(): Promise<Result<AuthSession>>;
  isAuthenticated(): Promise<Result<boolean>>;
  
  // User management
  getCurrentUser(): Promise<Result<User | null>>;
  updateUser(updates: Partial<User>): Promise<Result<User>>;
  deleteAccount(): Promise<Result<void>>;
  
  // Password management
  resetPassword(email: string): Promise<Result<void>>;
  confirmPasswordReset(token: string, newPassword: string): Promise<Result<void>>;
  changePassword(currentPassword: string, newPassword: string): Promise<Result<void>>;
  
  // Email verification
  sendVerificationEmail(): Promise<Result<void>>;
  verifyEmail(token: string): Promise<Result<void>>;
  isEmailVerified(): Promise<Result<boolean>>;
  
  // OAuth providers
  signInWithProvider(provider: AuthProvider): Promise<Result<AuthSession>>;
  linkProvider(provider: AuthProvider): Promise<Result<void>>;
  unlinkProvider(provider: AuthProvider): Promise<Result<void>>;
  
  // Events
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  provider?: AuthProvider;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: UserMetadata;
}

export interface UserMetadata {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  [key: string]: any;
}

export type AuthProvider = 'google' | 'apple' | 'facebook' | 'linkedin';

// Token management
export interface ITokenService {
  saveTokens(tokens: AuthTokens): Promise<Result<void>>;
  getTokens(): Promise<Result<AuthTokens | null>>;
  clearTokens(): Promise<Result<void>>;
  isTokenExpired(token: string): boolean;
  decodeToken(token: string): Result<TokenPayload>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  exp: number;
  iat: number;
  [key: string]: any;
}