# Testing Authentication Flow

## Environment Status ✅
- ✅ Environment variables configured (.env file)
- ✅ Supabase connection verified
- ✅ Database schema applied and ready

## Quick Start

1. **Start the Metro bundler:**
   ```bash
   npm start
   ```

2. **Choose your platform:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Testing Authentication

### Test Credentials
For quick testing, you can use:
- Email: `demo@nextchapter.app`
- Password: `DemoPassword123!`

### Test Flow

1. **Sign Up Flow:**
   - On the login screen, tap "Sign Up"
   - Enter a valid email (e.g., `yourname@example.com`)
   - Enter a password (min 8 chars, includes number)
   - Submit and check email for confirmation

2. **Login Flow:**
   - Enter registered email and password
   - Tap "Log In"
   - Should navigate to onboarding or main app

3. **Password Reset Flow:**
   - On login screen, tap "Forgot Password?"
   - Enter your email
   - Check email for reset link

## Common Issues & Solutions

### Issue: Metro bundler path alias errors
**Solution:** The app currently has path alias issues. Imports like `@context/AuthContext` may fail. This is next on the TODO list.

### Issue: "Cannot find module" errors
**Solution:** Try these commands:
```bash
# Clear Metro cache
npx expo start -c

# Reset watchman
watchman watch-del-all

# Clean and reinstall
rm -rf node_modules
npm install
```

### Issue: Authentication fails silently
**Solution:** Check the console for error messages. Common causes:
- Email not confirmed (check spam folder)
- Incorrect Supabase URL/key in .env
- Network connectivity issues

## Next Steps

After verifying authentication works:
1. Apply database schema in Supabase SQL Editor
2. Fix Metro bundler path aliases
3. Implement onboarding data persistence
4. Build out the home dashboard

## Debug Mode

To see detailed auth errors, you can:
1. Open the developer menu (shake device or Cmd+D on iOS)
2. Enable "Debug JS Remotely"
3. Check browser console for detailed logs