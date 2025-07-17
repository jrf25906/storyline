# Gradient Fix Instructions

## Issue
The app was using `react-native-linear-gradient` which is incompatible with Expo Go.

## Solution
We've updated the code to use `expo-linear-gradient` instead. 

## Installation Required
You need to install the expo-linear-gradient package:

```bash
npx expo install expo-linear-gradient
```

## Changes Made
1. Updated `src/components/common/Card.tsx` to import from `expo-linear-gradient`
2. Created mock for `expo-linear-gradient` in `__mocks__/expo-linear-gradient.js`
3. Updated `jest.config.js` to include `expo-linear-gradient` in transformIgnorePatterns

## Testing
After installation, run the tests to ensure everything works:

```bash
npm test
```

The gradient functionality should work exactly the same as before, but now it's compatible with Expo Go.