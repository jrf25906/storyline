// Environment configuration
// This file centralizes access to environment variables

const ENV = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // OpenAI
  OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  
  // Push Notifications
  EXPO_PROJECT_ID: process.env.EXPO_PROJECT_ID || '',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  
  // API
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  
  // Analytics
  ANALYTICS_API_KEY: process.env.ANALYTICS_API_KEY || '',
};

// Validate required environment variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(key => !ENV[key as keyof typeof ENV]);

if (missingVars.length > 0 && ENV.IS_PROD) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default ENV;