# Authentication and Security Features

## Overview
Next Chapter implements multiple layers of security to protect user data and ensure a smooth authentication experience. This document covers the biometric authentication and email verification features implemented in the app.

## Biometric Authentication

### Features
- **Face ID** support on iOS devices
- **Touch ID** support on older iOS devices
- **Fingerprint** authentication on Android devices
- **Face Recognition** on supported Android devices
- Automatic detection of available biometric hardware
- Secure storage of biometric preferences using expo-secure-store

### Implementation Details

#### BiometricService
Located at `src/services/auth/biometricService.ts`, this service provides:
- Hardware capability detection
- Biometric enrollment status checking
- Authentication prompts with fallback options
- Secure storage of user preferences
- Platform-specific biometric type detection

#### Integration Points
1. **LoginScreen**: 
   - Shows biometric option when enabled
   - Attempts automatic biometric login on mount
   - Provides manual biometric authentication button
   - Graceful fallback to password authentication

2. **AuthContext**:
   - Manages biometric state across the app
   - Prompts for biometric enrollment after successful sign-in
   - Tracks biometric support and enrollment status

3. **BiometricAuthScreen**:
   - Settings screen for managing biometric preferences
   - Enable/disable biometric authentication
   - Test biometric authentication
   - Privacy information display

### Security Considerations
- Biometric data never leaves the device
- Only a secure token linking the user account to device biometric is stored
- Authentication requires both valid biometric and active user session
- Automatic disable on sign-out

### Usage Flow
```
1. User signs in with email/password
2. If biometric is supported, prompt for enrollment
3. User accepts and authenticates with biometric
4. Next login: automatic biometric prompt or manual trigger
5. Success: user authenticated, failure: fallback to password
```

## Email Verification

### Features
- Automatic email sending on signup
- Real-time verification status checking
- Resend functionality with 60-second cooldown
- Change email option with account reset
- Automatic navigation on verification
- Clear user guidance and troubleshooting tips

### Implementation Details

#### EmailVerificationScreen
Located at `src/screens/auth/EmailVerificationScreen.tsx`:
- Polls Supabase every 5 seconds for verification status
- Shows loading, pending, and verified states
- Handles resend with cooldown timer
- Provides troubleshooting guidance

#### AuthContext Integration
- Tracks `isEmailVerified` state
- `checkEmailVerification()` method for manual checks
- `resendVerificationEmail()` method with error handling
- Updates verification status on auth state changes

### Email Verification Flow
```
1. User signs up with email/password
2. Automatic navigation to EmailVerificationScreen
3. Verification email sent via Supabase
4. Screen polls for verification status
5. User clicks link in email
6. Screen detects verification and shows success
7. Navigation to onboarding flow
```

### Resend Logic
- 60-second cooldown between resend attempts
- Visual countdown timer
- Success/error alerts
- Analytics tracking for resend events

## Testing

### Test Coverage
All authentication features include comprehensive test suites:

1. **BiometricService Tests** (`src/services/auth/__tests__/biometricService.test.ts`):
   - Hardware detection
   - Enrollment flows
   - Authentication success/failure scenarios
   - Platform-specific behavior

2. **EmailVerificationScreen Tests** (`src/screens/auth/__tests__/EmailVerificationScreen.test.tsx`):
   - Polling behavior
   - Resend functionality with cooldown
   - Navigation flows
   - Error handling

3. **LoginScreen Biometric Tests** (`src/screens/auth/__tests__/LoginScreen.biometric.test.tsx`):
   - Biometric UI display logic
   - Authentication flow integration
   - Error states and fallbacks

## Configuration

### Environment Variables
No additional environment variables required - features use existing Supabase configuration.

### Dependencies
```json
{
  "expo-local-authentication": "For biometric hardware access",
  "expo-secure-store": "For secure storage of biometric preferences",
  "@supabase/supabase-js": "For email verification"
}
```

## Best Practices

### For Developers
1. Always check `isBiometricSupported` before showing biometric UI
2. Handle authentication failures gracefully with clear user messaging
3. Test on both iOS and Android devices/simulators
4. Ensure proper cleanup of biometric preferences on sign-out

### For Users
1. Biometric authentication is optional and can be disabled anytime
2. Email verification is required for account security
3. Check spam folders for verification emails
4. Contact support if verification emails don't arrive

## Future Enhancements
- [ ] Multi-factor authentication (MFA)
- [ ] Security key support
- [ ] Passwordless authentication options
- [ ] Session management and device tracking
- [ ] Enhanced email deliverability monitoring