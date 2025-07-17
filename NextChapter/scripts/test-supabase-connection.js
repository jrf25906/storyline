#!/usr/bin/env node

// Test Supabase connection and basic auth operations
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1️⃣ Testing basic connection...');
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Successfully connected to Supabase!\n');

    // Test 2: Check auth configuration
    console.log('2️⃣ Testing auth configuration...');
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@nextchapter.app`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      console.log('❌ Auth configuration error:', signUpError.message);
      return false;
    }

    if (signUpData.user) {
      console.log('✅ Auth is properly configured!');
      console.log(`   Created test user: ${signUpData.user.email}`);
      
      // Clean up - delete the test user
      if (signUpData.user.id) {
        await supabase.auth.admin?.deleteUser(signUpData.user.id).catch(() => {
          // Admin API might not be available, that's ok
        });
      }
    }

    console.log('\n✅ All tests passed! Your Supabase setup is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Make sure the database schema is applied in Supabase SQL Editor');
    console.log('2. Start the app with: npm start');
    console.log('3. Test the full authentication flow in the app');
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});