# Next Chapter - Fixed Setup Guide

## ✅ Package Issues Resolved

The setup script has been updated to fix the missing packages:
- ❌ `@nozbe/sqlite-adapter` → ✅ Will be configured later with proper WatermelonDB setup
- ❌ `react-native-accessibility-info` → ✅ Removed (not needed initially)
- ✅ Added `@react-native-community/netinfo` for offline detection

## Quick Setup

### 1. **Install Dependencies**
```bash
# Run the corrected setup commands
npx create-expo-app@latest NextChapter --template blank-typescript
cd NextChapter

# Install all packages (this should work without errors now)
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-navigation/drawer
npx expo install expo-router expo-constants expo-status-bar expo-linking expo-notifications expo-device expo-sqlite expo-secure-store expo-font expo-splash-screen
npm install react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated react-native-vector-icons
npm install @nozbe/watermelondb @supabase/supabase-js date-fns
npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo
npm install --save-dev @types/react @types/react-native
```

### 2. **Add All Source Files**
Copy all the files from the artifacts above into your project:

**Configuration Files:**
- `app.json` 
- `babel.config.js`
- `metro.config.js` 
- `tsconfig.json`
- `.env.example` → copy to `.env` and fill in your keys

**Create the entire `src/` directory structure** with all the files from the artifacts.

### 3. **Setup Vector Icons (Important!)**

For icons to work properly, you need to configure react-native-vector-icons:

**For iOS (if testing on iOS):**
```bash
cd ios && pod install && cd ..
```

**For Android, add to `android/app/build.gradle`:**
```gradle
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```

**Or use Expo Vector Icons instead** (easier option):
```bash
npx expo install @expo/vector-icons
```

Then update the icon imports in `TabNavigator.tsx`:
```typescript
// Replace this line:
import Icon from 'react-native-vector-icons/MaterialIcons';

// With this:
import { MaterialIcons } from '@expo/vector-icons';

// And update the icon usage:
<MaterialIcons name={iconName} size={size} color={color} />
```

### 4. **Environment Setup**
```bash
# Copy and configure environment variables
cp .env.example .env
```

Add your actual API keys to `.env`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-key-here
```

### 5. **Test the App**
```bash
npx expo start
```

Press:
- `i` for iOS simulator
- `a` for Android emulator  
- `w` for web browser

## What You'll See

✅ **Working App!** The app should now launch without errors and show:
- Login/Signup screens with working forms
- Theme switching (light/dark/high contrast)
- Tab navigation with placeholder screens
- Offline detection banner
- Proper accessibility features

## What Works Right Now

✅ **Navigation**: Auth → Onboarding → Main app flow  
✅ **Authentication**: Login/signup forms (need Supabase setup)  
✅ **Theme System**: Light/dark/high contrast modes  
✅ **Placeholder Screens**: All main screens with feature descriptions  
✅ **Accessibility**: Proper touch targets, font sizes, screen reader support  
✅ **Offline Detection**: Banner shows when offline  

## Next Development Steps

### **Week 1: Authentication & Onboarding**
1. Set up Supabase database with the schema from the previous setup guide
2. Implement working authentication flow
3. Build actual onboarding forms (replace placeholders)
4. Save onboarding data to database

### **Week 2: Core Features**
1. Replace placeholder screens with actual functionality
2. Implement daily task system
3. Add basic AI coach chat
4. Create job application tracker

## Quick Fixes if Needed

**If you get icon errors:**
```bash
npx expo install @expo/vector-icons
# Then update the imports as shown above
```

**If you get navigation errors:**
```bash
npx expo install --fix
```

**If TypeScript errors:**
```bash
npm install --save-dev @types/react-native-vector-icons
```

## Ready for Claude Code

Your app foundation is now solid! You can start building features with:

```bash
claude-code "Create the actual Welcome onboarding screen with proper form inputs for layoff date, role, and state selection"
```

The placeholder screens show exactly what each feature should do, making it easy to replace them with real functionality one by one. 🚀