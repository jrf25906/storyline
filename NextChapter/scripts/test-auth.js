#!/usr/bin/env node

// Quick script to test if Supabase credentials are properly configured
require('dotenv').config();

const REQUIRED_VARS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('🔍 Checking NextChapter environment configuration...\n');

let allConfigured = true;

REQUIRED_VARS.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('your_')) {
    console.log(`❌ ${varName}: Not configured`);
    allConfigured = false;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log('\n' + '-'.repeat(50) + '\n');

if (allConfigured) {
  console.log('✅ All required environment variables are configured!');
  console.log('\nNext steps:');
  console.log('1. Run the database schema in Supabase SQL Editor');
  console.log('2. Start the app with: npm start');
  console.log('3. Test the authentication flow');
} else {
  console.log('❌ Some environment variables are missing.');
  console.log('\nTo fix this:');
  console.log('1. Copy .env.example to .env if you haven\'t already');
  console.log('2. Add your Supabase credentials from the Supabase dashboard');
  console.log('3. Run this script again to verify');
}

process.exit(allConfigured ? 0 : 1);