/**
 * Authentication Service
 * Handles user authentication with Firebase
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged,
  AuthError,
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    voiceSettings?: {
      transcriptionLanguage?: string;
      preferredVoice?: string;
    };
  };
}

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    if (isFirebaseConfigured && auth) {
      // Listen for auth state changes
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        this.cacheUserLocally(user);
      });
    }
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, displayName?: string): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured');
    }

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName || user.email!.split('@')[0],
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          theme: 'auto',
          voiceSettings: {
            transcriptionLanguage: 'en',
          },
        },
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      return userProfile;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login time
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: new Date(),
      });

      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      return userDoc.data() as UserProfile;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured || !db) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase not configured');
    }

    try {
      await updateDoc(doc(db, 'users', uid), updates);
      
      // Update auth profile if display name or photo changed
      if (this.currentUser && (updates.displayName || updates.photoURL)) {
        await updateProfile(this.currentUser, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Cache user data locally for offline access
   */
  private async cacheUserLocally(user: User | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }));
      } else {
        await AsyncStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error caching user:', error);
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: AuthError): Error {
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
    };

    const message = errorMessages[error.code] || error.message;
    return new Error(message);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Set up auth state listener
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
      return () => {};
    }
    
    return onAuthStateChanged(auth, callback);
  }
}

// Export singleton instance
export const authService = new AuthService();