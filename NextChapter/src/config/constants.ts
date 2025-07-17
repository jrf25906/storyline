// Application constants
export const APP_CONFIG = {
  name: 'NextChapter',
  version: '1.0.0',
  supportEmail: 'support@nextchapter.app',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@nextchapter/auth_token',
  USER_DATA: '@nextchapter/user_data',
  ONBOARDING_COMPLETE: '@nextchapter/onboarding_complete',
  THEME_PREFERENCE: '@nextchapter/theme_preference',
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  RESET_PASSWORD: '/auth/reset-password',
  
  // User
  USER_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile/update',
  
  // Features
  COACH_CHAT: '/coach/chat',
  BUDGET_DATA: '/budget/data',
  WELLNESS_ACTIVITIES: '/wellness/activities',
  JOB_TRACKER: '/jobs/tracker',
};

export const SCREEN_NAMES = {
  // Auth
  LOGIN: 'LoginScreen',
  SIGNUP: 'SignupScreen',
  FORGOT_PASSWORD: 'ForgotPasswordScreen',
  
  // Onboarding
  WELCOME: 'WelcomeScreen',
  LAYOFF_DETAILS: 'LayoffDetailsScreen',
  PERSONAL_INFO: 'PersonalInfoScreen',
  GOALS: 'GoalsScreen',
  
  // Main
  HOME: 'HomeScreen',
  COACH: 'CoachScreen',
  BUDGET: 'BudgetScreen',
  TRACKER: 'TrackerScreen',
  WELLNESS: 'WellnessScreen',
  BOUNCE_PLAN: 'BouncePlanScreen',
  SETTINGS: 'SettingsScreen',
};

export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CHAT_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 8,
};

export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  DEBOUNCE_SEARCH: 300, // 300ms
  SYNC_INTERVAL: 60000, // 1 minute
};