import { by, element, expect, device } from 'detox';
import { TestActions } from '../helpers/actions';
import { TestIds } from '../helpers/testIds';
import { TestData } from '../helpers/testData';

describe('Onboarding Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  describe('Happy Path', () => {
    it('should complete full onboarding flow and reach first task', async () => {
      // Start at welcome screen
      await TestActions.waitForElement(TestIds.onboarding.welcomeScreen);
      await TestActions.tap(TestIds.onboarding.startButton);

      // Personal info screen
      await TestActions.waitForElement(TestIds.onboarding.personalInfoScreen);
      await TestActions.typeText(TestIds.onboarding.nameInput, TestData.users.newUser.name);
      await TestActions.typeText(TestIds.onboarding.emailInput, TestData.users.newUser.email);
      await TestActions.typeText(TestIds.onboarding.passwordInput, TestData.users.newUser.password);
      await TestActions.tap(TestIds.onboarding.nextButton);

      // Layoff details screen
      await TestActions.waitForElement(TestIds.onboarding.layoffDetailsScreen);
      await TestActions.tap(TestIds.onboarding.layoffDateInput);
      // Date picker interaction would go here
      await TestActions.tap(TestIds.onboarding.industryPicker);
      await element(by.text(TestData.onboarding.industry)).tap();
      await TestActions.tap(TestIds.onboarding.nextButton);

      // Goals screen
      await TestActions.waitForElement(TestIds.onboarding.goalsScreen);
      // Select goals
      for (const goal of TestData.onboarding.goals) {
        await element(by.text(goal)).tap();
      }
      await TestActions.tap(TestIds.onboarding.completeButton);

      // Should reach home screen with first task
      await TestActions.waitForElement(TestIds.home.screen);
      await TestActions.waitForElement(TestIds.home.dailyTaskCard);
      
      // Verify first task is available
      await TestActions.verifyText(TestData.bouncePlan.day1TaskTitle);
    });
  });

  describe('Edge Cases', () => {
    it('should show validation errors for invalid inputs', async () => {
      await TestActions.waitForElement(TestIds.onboarding.welcomeScreen);
      await TestActions.tap(TestIds.onboarding.startButton);

      // Try to proceed without filling fields
      await TestActions.tap(TestIds.onboarding.nextButton);
      
      // Should show validation errors
      await TestActions.verifyText('Name is required');
      await TestActions.verifyText('Email is required');
      await TestActions.verifyText('Password is required');

      // Test weak password
      await TestActions.typeText(TestIds.onboarding.nameInput, TestData.users.newUser.name);
      await TestActions.typeText(TestIds.onboarding.emailInput, TestData.users.newUser.email);
      await TestActions.typeText(TestIds.onboarding.passwordInput, 'weak');
      await TestActions.tap(TestIds.onboarding.nextButton);
      
      await TestActions.verifyText(TestData.errors.weakPassword);
    });

    it('should handle back navigation during onboarding', async () => {
      await TestActions.waitForElement(TestIds.onboarding.welcomeScreen);
      await TestActions.tap(TestIds.onboarding.startButton);

      // Fill personal info and proceed
      await TestActions.typeText(TestIds.onboarding.nameInput, TestData.users.newUser.name);
      await TestActions.typeText(TestIds.onboarding.emailInput, TestData.users.newUser.email);
      await TestActions.typeText(TestIds.onboarding.passwordInput, TestData.users.newUser.password);
      await TestActions.tap(TestIds.onboarding.nextButton);

      // Go back from layoff details
      await TestActions.waitForElement(TestIds.onboarding.layoffDetailsScreen);
      await TestActions.goBack();

      // Should be back at personal info with data preserved
      await TestActions.waitForElement(TestIds.onboarding.personalInfoScreen);
      await TestActions.verifyElementText(TestIds.onboarding.nameInput, TestData.users.newUser.name);
    });
  });

  describe('Accessibility', () => {
    it('should be navigable with screen reader', async () => {
      // This test would verify all elements have proper accessibility labels
      await TestActions.waitForElement(TestIds.onboarding.welcomeScreen);
      
      // Verify key elements have accessibility labels
      await expect(element(by.id(TestIds.onboarding.startButton)))
        .toHaveLabel('Start onboarding');
    });
  });

  describe('Performance', () => {
    it('should complete onboarding within performance benchmarks', async () => {
      const startTime = Date.now();
      
      // Quick path through onboarding
      await TestActions.waitForElement(TestIds.onboarding.welcomeScreen);
      await TestActions.tap(TestIds.onboarding.startButton);
      
      await TestActions.typeText(TestIds.onboarding.nameInput, TestData.users.newUser.name);
      await TestActions.typeText(TestIds.onboarding.emailInput, TestData.users.newUser.email);
      await TestActions.typeText(TestIds.onboarding.passwordInput, TestData.users.newUser.password);
      await TestActions.tap(TestIds.onboarding.nextButton);
      
      await TestActions.tap(TestIds.onboarding.nextButton); // Skip optional fields
      await TestActions.tap(TestIds.onboarding.completeButton); // Use default goals
      
      await TestActions.waitForElement(TestIds.home.screen);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // 30 seconds max for full flow
    });
  });
});