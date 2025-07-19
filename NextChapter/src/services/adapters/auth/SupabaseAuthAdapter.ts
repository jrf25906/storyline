/**
 * Supabase adapter implementing IAuthService
 * Example of Adapter Pattern with proper error handling
 */

import { SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { IAuthService, SignUpCredentials, SignInCredentials, AuthSession, User, AuthProvider } from '@services/interfaces/auth/IAuthService';
import { Result, ok, err, tryCatch } from '@services/interfaces/common/result';
import { AuthenticationError, UnauthorizedError, SessionExpiredError } from '@services/interfaces/common/errors';

export class SupabaseAuthAdapter implements IAuthService {
  constructor(private readonly supabase: SupabaseClient) {}

  private mapSupabaseUser(user: SupabaseUser): User {
    return {
      id: user.id,
      email: user.email!,
      emailVerified: !!user.email_confirmed_at,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at || user.created_at),
      metadata: {
        displayName: user.user_metadata?.display_name,
        photoURL: user.user_metadata?.avatar_url,
        phoneNumber: user.phone,
        ...user.user_metadata
      }
    };
  }

  private mapSupabaseSession(session: Session): AuthSession {
    return {
      user: this.mapSupabaseUser(session.user),
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: new Date(session.expires_at! * 1000),
      provider: session.user.app_metadata?.provider as AuthProvider
    };
  }

  async signUp(credentials: SignUpCredentials): Promise<Result<AuthSession>> {
    return tryCatch(
      async () => {
        const { data, error } = await this.supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: credentials.metadata
          }
        });

        if (error) throw new AuthenticationError(error.message);
        if (!data.session) throw new AuthenticationError('No session returned after signup');

        return this.mapSupabaseSession(data.session);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async signIn(credentials: SignInCredentials): Promise<Result<AuthSession>> {
    return tryCatch(
      async () => {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        });

        if (error) {
          if (error.message.includes('Invalid login')) {
            throw new UnauthorizedError('Invalid email or password');
          }
          throw new AuthenticationError(error.message);
        }

        if (!data.session) throw new AuthenticationError('No session returned after signin');

        return this.mapSupabaseSession(data.session);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async signOut(): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw new AuthenticationError(error.message);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async getCurrentSession(): Promise<Result<AuthSession | null>> {
    return tryCatch(
      async () => {
        const { data: { session }, error } = await this.supabase.auth.getSession();
        
        if (error) throw new AuthenticationError(error.message);
        if (!session) return null;

        // Check if session is expired
        if (new Date(session.expires_at! * 1000) < new Date()) {
          throw new SessionExpiredError();
        }

        return this.mapSupabaseSession(session);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async refreshSession(): Promise<Result<AuthSession>> {
    return tryCatch(
      async () => {
        const { data: { session }, error } = await this.supabase.auth.refreshSession();
        
        if (error) {
          if (error.message.includes('refresh_token_not_found')) {
            throw new SessionExpiredError('Refresh token expired');
          }
          throw new AuthenticationError(error.message);
        }

        if (!session) throw new AuthenticationError('Failed to refresh session');

        return this.mapSupabaseSession(session);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async isAuthenticated(): Promise<Result<boolean>> {
    const sessionResult = await this.getCurrentSession();
    if (sessionResult.isErr()) return ok(false);
    return ok(sessionResult.value !== null);
  }

  async getCurrentUser(): Promise<Result<User | null>> {
    return tryCatch(
      async () => {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        
        if (error) throw new AuthenticationError(error.message);
        if (!user) return null;

        return this.mapSupabaseUser(user);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async updateUser(updates: Partial<User>): Promise<Result<User>> {
    return tryCatch(
      async () => {
        const { data, error } = await this.supabase.auth.updateUser({
          data: {
            display_name: updates.metadata?.displayName,
            avatar_url: updates.metadata?.photoURL,
            ...updates.metadata
          }
        });

        if (error) throw new AuthenticationError(error.message);
        if (!data.user) throw new AuthenticationError('Failed to update user');

        return this.mapSupabaseUser(data.user);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async deleteAccount(): Promise<Result<void>> {
    // Note: Supabase doesn't have a built-in delete account method
    // This would need to be implemented via an edge function
    return err(new AuthenticationError('Account deletion not implemented'));
  }

  async resetPassword(email: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) throw new AuthenticationError(error.message);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const { error } = await this.supabase.auth.updateUser({ 
          password: newPassword 
        });

        if (error) throw new AuthenticationError(error.message);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        // First verify current password
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new UnauthorizedError();

        const { error: signInError } = await this.supabase.auth.signInWithPassword({
          email: user.email!,
          password: currentPassword
        });

        if (signInError) throw new UnauthorizedError('Current password is incorrect');

        // Update password
        const { error } = await this.supabase.auth.updateUser({ 
          password: newPassword 
        });

        if (error) throw new AuthenticationError(error.message);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async sendVerificationEmail(): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new UnauthorizedError();

        // Note: Supabase sends verification email on signup
        // This would need custom implementation
        return;
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async verifyEmail(token: string): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const { error } = await this.supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) throw new AuthenticationError(error.message);
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async isEmailVerified(): Promise<Result<boolean>> {
    const userResult = await this.getCurrentUser();
    if (userResult.isErr()) return err(userResult.error);
    if (!userResult.value) return ok(false);
    return ok(userResult.value.emailVerified);
  }

  async signInWithProvider(provider: AuthProvider): Promise<Result<AuthSession>> {
    return tryCatch(
      async () => {
        const { data, error } = await this.supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) throw new AuthenticationError(error.message);
        
        // OAuth flow redirects, so we don't get a session immediately
        // The session will be established after redirect
        throw new AuthenticationError('OAuth redirect initiated');
      },
      (error) => error instanceof AuthenticationError ? error : new AuthenticationError(String(error))
    );
  }

  async linkProvider(provider: AuthProvider): Promise<Result<void>> {
    // Not directly supported by Supabase
    return err(new AuthenticationError('Provider linking not implemented'));
  }

  async unlinkProvider(provider: AuthProvider): Promise<Result<void>> {
    // Not directly supported by Supabase
    return err(new AuthenticationError('Provider unlinking not implemented'));
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          callback(this.mapSupabaseSession(session));
        } else {
          callback(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }
}