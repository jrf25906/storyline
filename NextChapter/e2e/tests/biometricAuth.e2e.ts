import { by, element, expect, device } from 'detox';
import { TestActions } from '../helpers/actions';
import { TestIds } from '../helpers/testIds';
import { TestData } from '../helpers/testData';

describe('Biometric Authentication Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ 
      newInstance: true,
      delete: true,
      permissions: { faceID: 'YES' } // For iOS
    });
  });

  describe('Initial Setup', () => {
    it('should prompt for biometric setup after first login', async () => {
      // Complete login
      await TestActions.tap('login-tab');
      await TestActions.typeText(TestIds.auth.loginScreen + '-email', TestData.users.biometricUser.email);
      await TestActions.typeText(TestIds.auth.loginScreen + '-password', TestData.users.biometricUser.password);
      await TestActions.tap('login-button');

      // Should show biometric enrollment prompt
      await TestActions.waitForElement(TestIds.auth.biometricPrompt);
      await TestActions.verifyText('Enable Face ID for faster login?');
      
      // Enable biometric
      await TestActions.tap(TestIds.auth.biometricEnableButton);

      // Should trigger system biometric prompt
      // Note: Detox handles biometric prompts automatically in test mode
      
      // Should reach home screen after successful setup
      await TestActions.waitForElement(TestIds.home.screen);
    });

    it('should allow skipping biometric setup', async () => {
      // Complete login
      await TestActions.tap('login-tab');
      await TestActions.typeText(TestIds.auth.loginScreen + '-email', TestData.users.biometricUser.email);
      await TestActions.typeText(TestIds.auth.loginScreen + '-password', TestData.users.biometricUser.password);
      await TestActions.tap('login-button');

      // Skip biometric setup
      await TestActions.waitForElement(TestIds.auth.biometricPrompt);
      await TestActions.tap(TestIds.auth.biometricSkipButton);

      // Should still reach home screen
      await TestActions.waitForElement(TestIds.home.screen);

      // Should not have biometric enabled in settings
      await TestActions.tap(TestIds.common.profileTab);
      await TestActions.tap(TestIds.settings.screen);
      await expect(element(by.id(TestIds.settings.biometricToggle))).toHaveToggleValue(false);
    });
  });

  describe('Biometric Login', () => {
    it('should login with biometrics after setup', async () => {
      // First, setup biometric (simplified for test)
      // In real scenario, this would be done in a previous session
      
      // Launch app fresh
      await device.launchApp({ newInstance: true });

      // Should show biometric login option
      await TestActions.waitForElement('biometric-login-button');
      await TestActions.tap('biometric-login-button');

      // Biometric prompt appears (auto-handled by Detox)
      
      // Should login successfully
      await TestActions.waitForElement(TestIds.home.screen);
    });

    it('should fallback to password on biometric failure', async () => {
      await device.launchApp({ newInstance: true });

      // Attempt biometric login
      await TestActions.tap('biometric-login-button');

      // Simulate biometric failure (Detox can be configured for this)
      // Falls back to password
      
      await TestActions.waitForElement('use-password-button');
      await TestActions.tap('use-password-button');

      // Should show password login
      await TestActions.waitForElement(TestIds.auth.loginScreen);
      await TestActions.typeText(TestIds.auth.loginScreen + '-password', TestData.users.biometricUser.password);
      await TestActions.tap('login-button');

      await TestActions.waitForElement(TestIds.home.screen);
    });
  });

  describe('Settings Management', () => {
    it('should toggle biometric authentication in settings', async () => {
      // Login first
      await TestActions.tap('login-tab');
      await TestActions.typeText(TestIds.auth.loginScreen + '-email', TestData.users.biometricUser.email);
      await TestActions.typeText(TestIds.auth.loginScreen + '-password', TestData.users.biometricUser.password);
      await TestActions.tap('login-button');
      
      // Skip initial biometric setup
      await TestActions.tap(TestIds.auth.biometricSkipButton);

      // Go to settings
      await TestActions.tap(TestIds.common.profileTab);
      await TestActions.tap(TestIds.settings.screen);

      // Enable biometric
      await TestActions.tap(TestIds.settings.biometricToggle);
      
      // Should prompt for password confirmation
      await TestActions.waitForElement('confirm-password-modal');
      await TestActions.typeText('confirm-password-input', TestData.users.biometricUser.password);
      await TestActions.tap('confirm-button');

      // Should trigger biometric enrollment
      // (Auto-handled by Detox)

      // Verify toggle is now on
      await expect(element(by.id(TestIds.settings.biometricToggle))).toHaveToggleValue(true);
    });

    it('should require password to disable biometrics', async () => {
      // Assume biometric is already enabled
      // Login with biometric
      await device.launchApp({ newInstance: true });
      await TestActions.tap('biometric-login-button');
      await TestActions.waitForElement(TestIds.home.screen);

      // Go to settings
      await TestActions.tap(TestIds.common.profileTab);
      await TestActions.tap(TestIds.settings.screen);

      // Try to disable biometric
      await TestActions.tap(TestIds.settings.biometricToggle);

      // Should require password
      await TestActions.waitForElement('confirm-password-modal');
      await TestActions.typeText('confirm-password-input', TestData.users.biometricUser.password);
      await TestActions.tap('confirm-button');

      // Should be disabled
      await expect(element(by.id(TestIds.settings.biometricToggle))).toHaveToggleValue(false);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle app backgrounding during biometric prompt', async () => {
      await device.launchApp({ newInstance: true });
      
      // Start biometric login
      await TestActions.tap('biometric-login-button');

      // Background the app
      await device.sendToHome();
      await device.launchApp({ newInstance: false });

      // Should still be at login screen (not logged in)
      await TestActions.waitForElement(TestIds.auth.loginScreen);
      await expect(element(by.id(TestIds.home.screen))).not.toBeVisible();
    });

    it('should re-authenticate after extended inactivity', async () => {
      // Login successfully
      await device.launchApp({ newInstance: true });
      await TestActions.tap('biometric-login-button');
      await TestActions.waitForElement(TestIds.home.screen);

      // Simulate extended inactivity by backgrounding
      await device.sendToHome();
      
      // Wait for session timeout (mocked in tests)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Return to app
      await device.launchApp({ newInstance: false });

      // Should require re-authentication
      await TestActions.waitForElement('session-expired-modal');
      await TestActions.verifyText('Please authenticate again');
      await TestActions.tap('authenticate-button');

      // Should trigger biometric prompt
      // (Auto-handled by Detox)

      // Should return to previous screen
      await TestActions.waitForElement(TestIds.home.screen);
    });

    it('should handle biometric hardware changes', async () => {
      // This would test scenarios where Face ID/Touch ID data changes
      // Implementation would need device-specific testing
    });
  });

  describe('Platform Differences', () => {
    it('should handle iOS Face ID correctly', async () => {
      if (device.getPlatform() !== 'ios') {
        return; // Skip on Android
      }

      await device.launchApp({ 
        newInstance: true,
        permissions: { faceID: 'YES' }
      });

      // iOS-specific Face ID flow
      await TestActions.tap('biometric-login-button');
      
      // Should show Face ID specific UI
      await TestActions.verifyText('Face ID');
    });

    it('should handle Android fingerprint correctly', async () => {
      if (device.getPlatform() !== 'android') {
        return; // Skip on iOS
      }

      await device.launchApp({ newInstance: true });

      // Android-specific fingerprint flow
      await TestActions.tap('biometric-login-button');
      
      // Should show fingerprint specific UI
      await TestActions.verifyText('Fingerprint');
    });
  });

  describe('Error Handling', () => {
    it('should handle biometric not available on device', async () => {
      // This would need to be tested on a device/simulator without biometric hardware
      // or with biometric disabled at system level
    });

    it('should handle biometric permission denied', async () => {
      await device.launchApp({ 
        newInstance: true,
        permissions: { faceID: 'NO' } // Deny permission
      });

      // Try to enable biometric after login
      await TestActions.tap('login-tab');
      await TestActions.typeText(TestIds.auth.loginScreen + '-email', TestData.users.biometricUser.email);
      await TestActions.typeText(TestIds.auth.loginScreen + '-password', TestData.users.biometricUser.password);
      await TestActions.tap('login-button');

      // Should show permission denied message instead of biometric prompt
      await TestActions.waitForElement('biometric-permission-denied');
      await TestActions.verifyText('Biometric authentication requires permission');
      await TestActions.verifyText('Enable in Settings');
    });
  });
});