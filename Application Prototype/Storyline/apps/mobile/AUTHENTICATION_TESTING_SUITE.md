# Authentication Testing Suite

## 🧪 Comprehensive Test Coverage for Storyline Authentication

This document outlines the automated testing suite for the authentication flow in the Storyline mobile app.

## 📋 Test Structure

### 1. Unit Tests: AuthService (`/src/services/auth/__tests__/authService.test.ts`)

**Purpose**: Test individual authentication service methods in isolation

**Coverage**:
- ✅ User Registration (`register()`)
  - Valid registration with display name
  - Registration without display name (uses email prefix)
  - Firebase not configured error handling
  - Firebase auth errors (email already in use, etc.)
  
- ✅ User Sign In (`signIn()`)
  - Successful sign in flow
  - User profile retrieval from Firestore
  - Last login time update
  - Invalid credentials handling
  - Missing user profile error
  
- ✅ User Sign Out (`signOut()`)
  - Successful sign out
  - Firebase not configured handling
  
- ✅ Password Reset (`resetPassword()`)
  - Successful password reset email
  - Firebase not configured error
  
- ✅ Auth State Management (`onAuthStateChange()`)
  - Auth state listener registration
  - Callback execution on state changes
  - Firebase not configured handling
  
- ✅ Current User (`getCurrentUser()`)
  - Return current user when available
  - Return null when not signed in

**Test Count**: 15 test cases

### 2. Integration Tests: SignInScreen (`/src/screens/Auth/__tests__/SignInScreen.test.tsx`)

**Purpose**: Test user interactions with the Sign In interface

**Coverage**:
- ✅ UI Elements Rendering
  - All required form elements present
  - Correct input properties (keyboard types, autocorrect, etc.)
  
- ✅ Form Interactions
  - Input value updates
  - Password visibility toggle
  
- ✅ Sign In Flow
  - Validation errors for missing fields
  - Successful sign in with valid credentials
  - Loading state during authentication
  - Error handling for invalid credentials
  
- ✅ Password Reset Flow
  - Email validation for password reset
  - Successful password reset
  - Error handling for reset failures
  
- ✅ Navigation
  - Navigation to sign up screen
  - Disabled navigation during loading
  
- ✅ Accessibility
  - Proper accessibility labels and structure

**Test Count**: 12 test cases

### 3. Integration Tests: SignUpScreen (`/src/screens/Auth/__tests__/SignUpScreen.test.tsx`)

**Purpose**: Test user registration interface and validation

**Coverage**:
- ✅ UI Elements Rendering
  - Complete form structure
  - Input properties and privacy information
  
- ✅ Form Interactions
  - All input value updates
  - Password visibility toggle for both fields
  - Terms agreement checkbox
  
- ✅ Form Validation
  - Empty fields validation
  - Invalid email format
  - Short password validation
  - Password mismatch detection
  - Terms agreement requirement
  
- ✅ Sign Up Flow
  - Successful account creation
  - Loading state management
  - Registration error handling
  
- ✅ Navigation & Edge Cases
  - Navigation to sign in
  - Disabled navigation during loading
  - Special characters in inputs
  - Input edge cases

**Test Count**: 16 test cases

### 4. End-to-End Tests: Authentication Flow (`/src/__tests__/authFlow.e2e.test.tsx`)

**Purpose**: Test complete authentication workflows from user perspective

**Coverage**:
- ✅ Complete Sign Up Flow
  - Full registration workflow
  - Registration error handling
  
- ✅ Complete Sign In Flow
  - Full sign in workflow
  - Invalid credentials handling
  
- ✅ Password Reset Flow
  - Complete password reset workflow
  - Email requirement validation
  
- ✅ Navigation Between Screens
  - Sign in ↔ Sign up navigation
  
- ✅ Authentication State Management
  - Auth state change handling
  - Loading state during auth check
  
- ✅ Form Validation Edge Cases
  - Various input validation scenarios
  - Password mismatch handling
  
- ✅ UI State During Operations
  - Loading states and disabled interactions

**Test Count**: 12 test cases

## 🚀 Running the Tests

### Prerequisites
```bash
cd apps/mobile
npm install
```

### Run All Authentication Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm test -- authService.test.ts

# SignIn screen tests
npm test -- SignInScreen.test.tsx

# SignUp screen tests  
npm test -- SignUpScreen.test.tsx

# E2E authentication flow
npm test -- authFlow.e2e.test.tsx
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode (for development)
```bash
npm run test:watch
```

## 📊 Test Coverage Summary

| Component | Test Cases | Coverage Areas |
|-----------|------------|----------------|
| AuthService | 15 | Service methods, error handling, Firebase integration |
| SignInScreen | 12 | UI interactions, form validation, navigation |
| SignUpScreen | 16 | Registration flow, complex validation, UX |
| E2E Flow | 12 | Complete user journeys, state management |
| **Total** | **55** | **Comprehensive authentication coverage** |

## 🎯 What These Tests Validate

### ✅ Security & Validation
- Password strength requirements (6+ characters)
- Email format validation
- Input sanitization and edge cases
- Terms agreement enforcement
- Firebase security integration

### ✅ User Experience
- Loading states during operations
- Appropriate error messages
- Smooth navigation between screens
- Form field accessibility
- Password visibility controls

### ✅ Error Handling
- Network failures
- Firebase authentication errors
- Form validation errors
- User-friendly error messages
- Graceful degradation when Firebase unavailable

### ✅ Integration Points
- Firebase Authentication service
- Firestore user profile management
- AsyncStorage for session persistence
- React Native Alert system

## 🔧 Test Configuration

### Jest Configuration (package.json)
```json
{
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [...],
    "setupFilesAfterEnv": ["@testing-library/jest-native/extend-expect"],
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/index.ts"
    ]
  }
}
```

### Dependencies Added
- `@testing-library/react-native`: Component testing utilities
- `@testing-library/jest-native`: React Native-specific matchers
- `jest`: Test runner
- `jest-expo`: Expo-specific Jest preset
- `react-test-renderer`: Required for React component testing

## 🛡️ Mock Strategy

### Firebase Mocking (`/src/__mocks__/firebase.ts`)
- Complete Firebase Auth API mock
- Firestore operations mock
- Configurable responses for different test scenarios
- Reset functionality for test isolation

### Benefits
- Tests run without Firebase connection
- Predictable test behavior
- Fast execution
- Isolated test environment

## 📈 Continuous Integration

### Recommended CI Pipeline
```yaml
name: Authentication Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd apps/mobile && npm install
      - run: cd apps/mobile && npm test
      - run: cd apps/mobile && npm run test:coverage
```

## 🎨 Test Quality Features

### Trauma-Informed Testing
- Tests validate privacy messaging
- Validates user control over data
- Tests security feature communications

### Accessibility Testing
- Form accessibility validation
- Screen reader compatibility checks
- Keyboard navigation testing

### Performance Considerations
- Loading state validation
- Timeout handling
- Memory leak prevention

## 🔍 Debugging Tests

### Common Issues
1. **Firebase Mock Issues**: Ensure `resetFirebaseMocks()` is called in `beforeEach`
2. **Async Test Issues**: Use `waitFor()` for async operations
3. **Alert Mock Issues**: Verify Alert.alert mock implementation

### Debug Commands
```bash
# Run specific test with verbose output
npm test -- --verbose SignInScreen.test.tsx

# Run single test case
npm test -- --testNamePattern="should successfully sign in"

# Debug mode
npm test -- --runInBand --detectOpenHandles
```

## 📝 Writing Additional Tests

### Test Naming Convention
- Use descriptive test names: `should [expected behavior] when [condition]`
- Group related tests in `describe` blocks
- Use `it` for individual test cases

### Mock Management
- Reset mocks in `beforeEach`
- Use `jest.clearAllMocks()` for general cleanup
- Configure specific mock responses per test

### Best Practices
- Test behavior, not implementation
- Cover happy path and error cases
- Include edge cases and boundary conditions
- Maintain test independence

---

## 🎉 Success Criteria

These tests ensure that:
- ✅ Authentication flow is reliable and secure
- ✅ User experience is smooth and accessible  
- ✅ Error handling is comprehensive and user-friendly
- ✅ Privacy and security features work correctly
- ✅ Code is maintainable and regression-proof

The authentication system is now thoroughly tested and ready for production use!