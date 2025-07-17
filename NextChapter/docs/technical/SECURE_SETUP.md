# Secure API Key Setup Guide

This guide explains how to securely configure API keys for the Next Chapter app.

## Overview

The app uses `react-native-keychain` to securely store sensitive credentials like API keys. This ensures that:
- Credentials are encrypted at rest
- Biometric authentication can be required for access
- Keys are never hardcoded in the source code
- Different keys can be used for development/staging/production

## Initial Setup

### 1. Copy Environment File

```bash
cp .env.example .env
```

### 2. Add Your Credentials

Edit `.env` and add your actual API keys:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...
```

### 3. Never Commit `.env`

The `.env` file is already in `.gitignore`. Never commit it to version control.

## Security Architecture

### Keychain Storage

On first app launch, credentials are:
1. Read from environment variables
2. Stored securely in the device keychain
3. Retrieved from keychain on subsequent launches

### Service Initialization

```typescript
// App.tsx or your root component
import { initializeAppServices } from './src/services/initialization';

useEffect(() => {
  initializeAppServices().then((success) => {
    if (!success) {
      // Handle initialization failure
      // Show setup screen or error message
    }
  });
}, []);
```

### Row Level Security

All Supabase tables must have RLS enabled. The app validates this on startup:

```sql
-- Example RLS policy for tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own tasks" 
ON tasks FOR ALL 
USING (auth.uid() = user_id);
```

## Development Workflow

### Running Tests

All security services have comprehensive tests:

```bash
# Run security tests
npm test src/services/security
npm test src/services/api/__tests__/supabaseSecure.test.ts
npm test src/services/api/__tests__/openaiSecure.test.ts
```

### Updating Credentials

To update credentials after initial setup:

```typescript
import { setupSecureCredentials } from './src/services/initialization';

const success = await setupSecureCredentials(
  newSupabaseUrl,
  newSupabaseAnonKey,
  newOpenAIApiKey
);
```

### Clearing Credentials

For logout or app reset:

```typescript
import { clearStoredCredentials } from './src/services/initialization';

await clearStoredCredentials();
```

## Security Best Practices

1. **API Key Rotation**: Rotate keys every 90 days
2. **Environment Separation**: Use different keys for dev/staging/prod
3. **Access Monitoring**: Monitor API usage for anomalies
4. **Biometric Protection**: Enable biometric authentication for key access
5. **Error Handling**: Never log or display raw API keys in errors

## Content Filtering

The OpenAI service automatically:
- Filters financial data (SSN, credit cards, bank accounts)
- Detects crisis keywords and provides appropriate resources
- Implements rate limiting (10 messages/day for free tier)
- Moderates inappropriate content

## Troubleshooting

### "Environment not initialized" Error

This means the app couldn't load credentials. Check:
1. `.env` file exists and has valid values
2. Environment variables are properly formatted
3. Keychain permissions are granted

### "RLS not enabled" Warning

This means Row Level Security is not configured on Supabase tables:
1. Go to Supabase dashboard
2. Navigate to Authentication > Policies
3. Enable RLS for all tables
4. Add appropriate policies

### "Invalid API key format" Error

Ensure your API keys match expected formats:
- Supabase URL: `https://[project-id].supabase.co`
- OpenAI Key: Starts with `sk-proj-` or `sk-`

## Production Deployment

For production builds:

1. Store credentials in your CI/CD secret manager
2. Inject them during build process
3. Never include `.env` in production builds
4. Monitor API usage and set up alerts
5. Implement key rotation schedule

## Support

If you encounter issues:
1. Check test output: `npm test`
2. Review security logs in console
3. Verify credential format in `.env`
4. Ensure all dependencies are installed: `npm install`