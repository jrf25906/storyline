import { by, element, expect, device, waitFor } from 'detox';

/**
 * Common E2E test actions and helpers
 */

export class TestActions {
  /**
   * Wait for an element to be visible with a custom timeout
   */
  static async waitForElement(testId: string, timeout = 10000) {
    await waitFor(element(by.id(testId)))
      .toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * Type text into an input field
   */
  static async typeText(testId: string, text: string) {
    await this.waitForElement(testId);
    await element(by.id(testId)).typeText(text);
  }

  /**
   * Clear and type text into an input field
   */
  static async clearAndTypeText(testId: string, text: string) {
    await this.waitForElement(testId);
    await element(by.id(testId)).clearText();
    await element(by.id(testId)).typeText(text);
  }

  /**
   * Tap on an element
   */
  static async tap(testId: string) {
    await this.waitForElement(testId);
    await element(by.id(testId)).tap();
  }

  /**
   * Long press on an element
   */
  static async longPress(testId: string, duration = 1000) {
    await this.waitForElement(testId);
    await element(by.id(testId)).longPress(duration);
  }

  /**
   * Scroll to an element
   */
  static async scrollTo(testId: string, scrollViewTestId?: string, direction: 'up' | 'down' = 'down') {
    const scrollView = scrollViewTestId ? element(by.id(scrollViewTestId)) : element(by.type('ScrollView')).atIndex(0);
    await waitFor(element(by.id(testId)))
      .toBeVisible()
      .whileElement(scrollView)
      .scroll(200, direction);
  }

  /**
   * Swipe on an element
   */
  static async swipe(testId: string, direction: 'up' | 'down' | 'left' | 'right', speed: 'fast' | 'slow' = 'fast') {
    await this.waitForElement(testId);
    await element(by.id(testId)).swipe(direction, speed);
  }

  /**
   * Check if element exists (doesn't have to be visible)
   */
  static async elementExists(testId: string) {
    try {
      await expect(element(by.id(testId))).toExist();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element is visible
   */
  static async isVisible(testId: string) {
    try {
      await expect(element(by.id(testId))).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reload the app
   */
  static async reloadApp() {
    await device.reloadReactNative();
  }

  /**
   * Toggle airplane mode (Android only)
   */
  static async toggleAirplaneMode() {
    if (device.getPlatform() === 'android') {
      await device.toggleAirplaneMode();
    }
  }

  /**
   * Disable network (iOS only)
   */
  static async disableNetwork() {
    if (device.getPlatform() === 'ios') {
      await device.setURLBlacklist(['.*']);
    }
  }

  /**
   * Enable network (iOS only)
   */
  static async enableNetwork() {
    if (device.getPlatform() === 'ios') {
      await device.setURLBlacklist([]);
    }
  }

  /**
   * Take a screenshot
   */
  static async takeScreenshot(name: string) {
    await device.takeScreenshot(name);
  }

  /**
   * Handle permissions
   */
  static async handlePermission(permission: 'notifications' | 'camera' | 'photos' | 'location', grant = true) {
    if (device.getPlatform() === 'ios') {
      await device.launchApp({
        permissions: {
          [permission]: grant ? 'YES' : 'NO',
        },
      });
    }
  }

  /**
   * Verify text is visible
   */
  static async verifyText(text: string) {
    await expect(element(by.text(text))).toBeVisible();
  }

  /**
   * Verify element has text
   */
  static async verifyElementText(testId: string, expectedText: string) {
    await expect(element(by.id(testId))).toHaveText(expectedText);
  }

  /**
   * Wait for loading to complete
   */
  static async waitForLoadingToComplete(loadingTestId = 'loading-indicator', timeout = 30000) {
    try {
      await waitFor(element(by.id(loadingTestId)))
        .not.toBeVisible()
        .withTimeout(timeout);
    } catch {
      // Loading indicator might not appear at all, which is fine
    }
  }

  /**
   * Dismiss keyboard
   */
  static async dismissKeyboard() {
    if (device.getPlatform() === 'ios') {
      await element(by.label('Done')).tap();
    } else {
      await device.pressBack();
    }
  }

  /**
   * Navigate back
   */
  static async goBack() {
    if (await this.elementExists('back-button')) {
      await this.tap('back-button');
    } else {
      await device.pressBack();
    }
  }

  /**
   * Measure performance metrics
   */
  static async measurePerformance(action: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await action();
    const endTime = Date.now();
    return endTime - startTime;
  }
}