# Authentication Flow Test Guide

## 🧪 Testing Steps

### 1. First Launch (Not Authenticated)
When the app loads, you should see:
- **Sign In Screen** with email/password fields
- "Welcome Back" title
- "Create New Account" button at bottom

### 2. Test Sign Up Flow
1. Click **"Create New Account"**
2. You'll see the Sign Up screen with:
   - Display Name field
   - Email field
   - Password field (with eye icon to show/hide)
   - Confirm Password field
   - Terms checkbox
3. Try these test cases:

#### ❌ Invalid Inputs (Should Show Errors):
- Leave fields empty → "Please fill in all fields"
- Invalid email (no @) → "Please enter a valid email address"
- Short password (<6 chars) → "Password must be at least 6 characters"
- Mismatched passwords → "Passwords do not match"
- Unchecked terms → "Please agree to the terms"

#### ✅ Valid Sign Up:
- Display Name: `Test User`
- Email: `test@example.com`
- Password: `test123`
- Confirm: `test123`
- ✓ Check terms
- Click **"Create Account"**

### 3. Test Main App (Authenticated)
After successful sign up, you should see:
- Main recording interface
- **Profile icon (👤)** in header next to theme toggle
- Your recordings will now be saved to Firebase

### 4. Test Voice Recording with Auth
1. Tap the microphone to record
2. Speak for a few seconds
3. Tap to stop
4. Recording should:
   - Save locally
   - Upload to Firebase Storage
   - Show in recent recordings

### 5. Test Profile Menu
1. Tap the **profile icon (👤)** in header
2. Should show:
   - "Signed in as test@example.com"
   - Sign Out option
3. Test Sign Out → Returns to Sign In screen

### 6. Test Sign In Flow
After signing out:
1. Enter credentials:
   - Email: `test@example.com`
   - Password: `test123`
2. Click **"Sign In"**
3. Should return to main app

### 7. Test Password Reset
1. On Sign In screen, click **"Forgot Password?"**
2. Enter email: `test@example.com`
3. Should show success message
4. (Email would be sent if Firebase email is configured)

## 🔍 What to Look For:

### ✅ Success Indicators:
- Smooth transitions between screens
- Loading spinners during authentication
- Error messages for invalid inputs
- Profile icon appears when authenticated
- Recordings saved to cloud (check Firebase Console)

### ⚠️ Possible Issues:

#### If Authentication Doesn't Work:
1. Check `.env` file has valid Firebase config
2. Verify Firebase Authentication is enabled
3. Check console for error messages

#### If Still Showing Main App (No Auth):
- Firebase might not be configured
- App skips auth if Firebase keys are missing

## 📱 iOS Simulator Tips:
- Use keyboard shortcuts to type faster
- Cmd+K to toggle software keyboard
- Shake gesture (Cmd+Ctrl+Z) for dev menu

## 🔐 Security Features:
- Passwords are masked by default
- Eye icon to toggle visibility
- Sessions persist across app restarts
- Secure token storage

## 🎨 UI Polish:
- Smooth animations
- Professional form styling
- Trauma-informed messaging
- Privacy-focused copy

Happy testing! 🚀