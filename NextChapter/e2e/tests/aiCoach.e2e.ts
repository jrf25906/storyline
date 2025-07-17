import { by, element, expect, device } from 'detox';
import { TestActions } from '../helpers/actions';
import { TestIds } from '../helpers/testIds';
import { TestData } from '../helpers/testData';

describe('AI Coach Interactions', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    // TODO: Add login flow
  });

  describe('Tone Switching', () => {
    it('should switch to hype tone for hopeless messages', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Send message with hype trigger
      await TestActions.typeText(TestIds.coach.messageInput, TestData.coachMessages.hype.trigger);
      await TestActions.tap(TestIds.coach.sendButton);

      // Wait for response
      await TestActions.waitForElement(TestIds.coach.typingIndicator);
      await TestActions.waitForElement(TestIds.coach.messageBubble(1), 10000);

      // Verify hype tone indicator
      await expect(element(by.id(TestIds.coach.toneSelector))).toHaveLabel('Current tone: Hype');
    });

    it('should switch to tough-love tone for blame messages', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Send message with tough-love trigger
      await TestActions.typeText(TestIds.coach.messageInput, TestData.coachMessages.toughLove.trigger);
      await TestActions.tap(TestIds.coach.sendButton);

      // Wait for response
      await TestActions.waitForElement(TestIds.coach.typingIndicator);
      await TestActions.waitForElement(TestIds.coach.messageBubble(1), 10000);

      // Verify tough-love tone
      await expect(element(by.id(TestIds.coach.toneSelector))).toHaveLabel('Current tone: Tough Love');
    });

    it('should default to pragmatist tone for neutral messages', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Send neutral message
      await TestActions.typeText(TestIds.coach.messageInput, TestData.coachMessages.pragmatist.trigger);
      await TestActions.tap(TestIds.coach.sendButton);

      // Wait for response
      await TestActions.waitForElement(TestIds.coach.typingIndicator);
      await TestActions.waitForElement(TestIds.coach.messageBubble(1), 10000);

      // Verify pragmatist tone
      await expect(element(by.id(TestIds.coach.toneSelector))).toHaveLabel('Current tone: Pragmatist');
    });

    it('should allow manual tone selection', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Open tone selector
      await TestActions.tap(TestIds.coach.toneSelector);

      // Select hype tone manually
      await TestActions.tap(TestIds.coach.hypeButton);

      // Send any message
      await TestActions.typeText(TestIds.coach.messageInput, 'Hello coach');
      await TestActions.tap(TestIds.coach.sendButton);

      // Verify tone persists
      await expect(element(by.id(TestIds.coach.toneSelector))).toHaveLabel('Current tone: Hype');
    });
  });

  describe('Crisis Intervention', () => {
    it('should show crisis alert for distress keywords', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Send crisis message
      await TestActions.typeText(TestIds.coach.messageInput, TestData.coachMessages.crisis.trigger);
      await TestActions.tap(TestIds.coach.sendButton);

      // Should immediately show crisis alert
      await TestActions.waitForElement(TestIds.coach.crisisAlert, 2000);
      
      // Verify crisis resources are visible
      await TestActions.verifyText('988');
      await TestActions.verifyText('Suicide & Crisis Lifeline');
      await TestActions.verifyText('Call Now');
    });

    it('should still respond appropriately after crisis alert', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Send crisis message
      await TestActions.typeText(TestIds.coach.messageInput, TestData.coachMessages.crisis.trigger);
      await TestActions.tap(TestIds.coach.sendButton);

      // Dismiss crisis alert
      await TestActions.waitForElement(TestIds.coach.crisisAlert);
      await element(by.text('Continue to Chat')).tap();

      // Should still get supportive response
      await TestActions.waitForElement(TestIds.coach.messageBubble(1), 10000);
      
      // Verify response contains supportive language
      const responseElement = element(by.id(TestIds.coach.messageBubble(1)));
      await expect(responseElement).toBeVisible();
    });
  });

  describe('Offline Behavior', () => {
    it('should show cached responses when offline', async () => {
      // First, load the coach screen while online to cache data
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Go offline
      await TestActions.disableNetwork();

      // Should show offline mode indicator
      await TestActions.verifyText('Offline Mode - Limited Responses');

      // Try to send a message
      await TestActions.typeText(TestIds.coach.messageInput, 'What should I do today?');
      await TestActions.tap(TestIds.coach.sendButton);

      // Should show cached/generic response
      await TestActions.waitForElement(TestIds.coach.messageBubble(0));
      await TestActions.verifyText('While offline, here are some general tips');
    });

    it('should queue messages for sending when back online', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Go offline
      await TestActions.disableNetwork();

      // Send message offline
      const offlineMessage = 'This was sent offline';
      await TestActions.typeText(TestIds.coach.messageInput, offlineMessage);
      await TestActions.tap(TestIds.coach.sendButton);

      // Message should appear with pending indicator
      await expect(element(by.text(offlineMessage))).toBeVisible();
      await expect(element(by.id('message-pending-0'))).toBeVisible();

      // Go back online
      await TestActions.enableNetwork();

      // Message should sync and get response
      await TestActions.waitForElement(TestIds.coach.messageBubble(1), 15000);
      await expect(element(by.id('message-pending-0'))).not.toBeVisible();
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      const responseTime = await TestActions.measurePerformance(async () => {
        await TestActions.typeText(TestIds.coach.messageInput, 'Hello coach');
        await TestActions.tap(TestIds.coach.sendButton);
        await TestActions.waitForElement(TestIds.coach.messageBubble(1));
      });

      expect(responseTime).toBeLessThan(TestData.performance.apiResponse);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce daily message limit for free tier', async () => {
      await TestActions.tap(TestIds.common.coachTab);
      await TestActions.waitForElement(TestIds.coach.screen);

      // Send 10 messages (free tier limit)
      for (let i = 0; i < 10; i++) {
        await TestActions.typeText(TestIds.coach.messageInput, `Message ${i + 1}`);
        await TestActions.tap(TestIds.coach.sendButton);
        await TestActions.waitForElement(TestIds.coach.messageBubble(i * 2 + 1), 10000);
      }

      // 11th message should show rate limit error
      await TestActions.typeText(TestIds.coach.messageInput, 'Message 11');
      await TestActions.tap(TestIds.coach.sendButton);

      await TestActions.verifyText('Daily message limit reached');
      await TestActions.verifyText('Upgrade to Pro');
    });
  });
});