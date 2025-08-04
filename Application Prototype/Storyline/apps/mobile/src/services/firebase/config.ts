/**
 * Firebase Configuration
 * Initializes Firebase services for the app
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required config values are present
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => 
  value && value !== 'your_key_here' && value !== 'your_project_id_here'
);

// Initialize Firebase only if properly configured
let app: any;
let auth: any;
let db: any;
let storage: any;

if (isFirebaseConfigured) {
  try {
    // Initialize app (or get existing instance)
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize auth with React Native persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('Firebase not configured. Please add your Firebase configuration to .env file');
}

export { app, auth, db, storage, isFirebaseConfigured };