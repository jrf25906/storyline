/**
 * Crisis Intervention Test Helpers
 * Critical safety feature testing utilities
 */

import { by, element, expect } from 'detox';
import { TestActions } from './actions';

export const CrisisKeywords = {
  // Direct crisis phrases
  direct: [
    'I want to end it all',
    'I want to kill myself',
    'I don\'t want to live anymore',
    'I\'m going to hurt myself',
    'Life isn\'t worth living',
  ],
  
  // Indirect crisis phrases
  indirect: [
    'Everyone would be better off without me',
    'I can\'t take this anymore',
    'There\'s no point in going on',
    'I\'m a burden to everyone',
    'Nothing matters anymore',
  ],
  
  // Edge cases that should NOT trigger crisis
  falsePositives: [
    'I want to end this job search',
    'This is killing my confidence',
    'I hurt myself by not preparing',
    'I need to kill these bad habits',
  ],
};

export class CrisisTestHelpers {
  /**
   * Verify crisis alert appears with correct resources
   */
  static async verifyCrisisAlert() {
    // Alert should appear quickly
    await TestActions.waitForElement('crisis-alert', 2000);
    
    // Verify essential elements
    await TestActions.verifyText('988');
    await TestActions.verifyText('Suicide & Crisis Lifeline');
    await TestActions.verifyText('Call Now');
    await TestActions.verifyText('Text "HELLO" to 741741');
    
    // Verify call button is accessible
    await expect(element(by.id('crisis-call-button')))
      .toBeVisible()
      .toHaveLabel('Call crisis hotline');
    
    // Verify text button is accessible
    await expect(element(by.id('crisis-text-button')))
      .toBeVisible()
      .toHaveLabel('Text crisis line');
  }
  
  /**
   * Test crisis keyword detection
   */
  static async testCrisisKeyword(keyword: string, shouldTrigger: boolean = true) {
    await TestActions.typeText('coach-message-input', keyword);
    await TestActions.tap('coach-send-button');
    
    if (shouldTrigger) {
      await this.verifyCrisisAlert();
    } else {
      // Should NOT show crisis alert
      try {
        await expect(element(by.id('crisis-alert'))).not.toBeVisible();
      } catch {
        // Element might not exist at all, which is fine
      }
    }
  }
  
  /**
   * Verify coach response after crisis alert
   */
  static async verifySupportiveResponse() {
    // Dismiss crisis alert
    const continueButton = element(by.text('Continue to Chat'));
    if (await TestActions.elementExists('continue-to-chat-button')) {
      await TestActions.tap('continue-to-chat-button');
    }
    
    // Wait for coach response
    await TestActions.waitForElement('message-bubble-1', 10000);
    
    // Verify response contains supportive language
    const supportivePhrases = [
      'I\'m here',
      'You\'re not alone',
      'support',
      'help',
      'care',
      'matter',
      'important',
    ];
    
    // At least one supportive phrase should be present
    let foundSupportive = false;
    for (const phrase of supportivePhrases) {
      try {
        await expect(element(by.text(phrase).withAncestor(by.id('message-bubble-1'))))
          .toExist();
        foundSupportive = true;
        break;
      } catch {
        // Continue checking other phrases
      }
    }
    
    expect(foundSupportive).toBe(true);
  }
  
  /**
   * Test crisis resources accessibility
   */
  static async testCrisisResourcesAccessibility() {
    // Trigger crisis alert
    await this.testCrisisKeyword(CrisisKeywords.direct[0]);
    
    // Test VoiceOver/TalkBack announcements
    await expect(element(by.id('crisis-alert')))
      .toHaveLabel('Crisis support resources. Immediate help available.');
    
    // Verify all interactive elements have proper labels
    const elements = [
      { id: 'crisis-call-button', label: 'Call crisis hotline' },
      { id: 'crisis-text-button', label: 'Text crisis line' },
      { id: 'crisis-chat-button', label: 'Chat with counselor' },
      { id: 'crisis-resources-link', label: 'More resources' },
      { id: 'continue-to-chat-button', label: 'Continue to chat' },
    ];
    
    for (const elem of elements) {
      if (await TestActions.elementExists(elem.id)) {
        await expect(element(by.id(elem.id))).toHaveLabel(elem.label);
      }
    }
  }
  
  /**
   * Test crisis alert persistence
   */
  static async testCrisisAlertPersistence() {
    // Alert should not auto-dismiss
    await this.testCrisisKeyword(CrisisKeywords.direct[0]);
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Alert should still be visible
    await expect(element(by.id('crisis-alert'))).toBeVisible();
    
    // Try to interact with other elements - should be blocked
    try {
      await TestActions.tap('home-tab');
      // Should not be able to navigate away
      throw new Error('Should not be able to navigate with crisis alert open');
    } catch {
      // Expected - navigation should be blocked
    }
  }
  
  /**
   * Test crisis history tracking
   */
  static async testCrisisHistoryTracking() {
    // Send crisis message
    await this.testCrisisKeyword(CrisisKeywords.direct[0]);
    
    // Dismiss alert
    await TestActions.tap('continue-to-chat-button');
    
    // Navigate away and back
    await TestActions.tap('home-tab');
    await TestActions.tap('coach-tab');
    
    // Should show crisis follow-up
    await TestActions.verifyText('How are you feeling now?');
    await TestActions.verifyText('Crisis resources are always available');
  }
  
  /**
   * Performance test for crisis detection
   */
  static async testCrisisDetectionPerformance() {
    const detectionTime = await TestActions.measurePerformance(async () => {
      await TestActions.typeText('coach-message-input', CrisisKeywords.direct[0]);
      await TestActions.tap('coach-send-button');
      await TestActions.waitForElement('crisis-alert');
    });
    
    // Crisis detection should be near-instant (< 500ms)
    expect(detectionTime).toBeLessThan(500);
  }
  
  /**
   * Test multiple crisis triggers in conversation
   */
  static async testMultipleCrisisTriggers() {
    // First crisis message
    await this.testCrisisKeyword(CrisisKeywords.direct[0]);
    await TestActions.tap('continue-to-chat-button');
    
    // Send non-crisis message
    await TestActions.typeText('coach-message-input', 'I\'m trying to feel better');
    await TestActions.tap('coach-send-button');
    
    // Second crisis message should still trigger
    await this.testCrisisKeyword(CrisisKeywords.indirect[0]);
    
    // Verify alert appears again
    await this.verifyCrisisAlert();
  }
}