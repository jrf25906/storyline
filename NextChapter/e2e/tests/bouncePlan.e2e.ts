import { by, element, expect, device } from 'detox';
import { TestActions } from '../helpers/actions';
import { TestIds } from '../helpers/testIds';
import { TestData } from '../helpers/testData';

describe('Bounce Plan Daily Tasks', () => {
  beforeEach(async () => {
    // Launch app with existing user
    await device.launchApp({ newInstance: true });
    // TODO: Add login flow or mock auth state
  });

  describe('Task Completion', () => {
    it('should allow completing daily task', async () => {
      // Navigate to bounce plan
      await TestActions.tap(TestIds.common.bouncePlanTab);
      await TestActions.waitForElement(TestIds.bouncePlan.screen);

      // Find today's task
      const todayTaskId = TestIds.bouncePlan.taskCard('day-1');
      await TestActions.waitForElement(todayTaskId);
      await TestActions.tap(todayTaskId);

      // View task details
      await TestActions.waitForElement(TestIds.bouncePlan.taskDetailModal);
      await TestActions.verifyText(TestData.bouncePlan.day1TaskTitle);

      // Complete task
      await TestActions.tap(TestIds.bouncePlan.completeTaskButton);

      // Verify task marked as complete
      await TestActions.waitForElement(TestIds.bouncePlan.screen);
      await expect(element(by.id(todayTaskId))).toHaveLabel('Completed');

      // Verify progress updated
      await TestActions.verifyText('1 of 30 tasks completed');
    });

    it('should allow skipping tasks on weekends', async () => {
      // This would need to mock the current date to be a weekend
      // Implementation depends on your date mocking strategy
    });

    it('should prevent accessing future tasks', async () => {
      await TestActions.tap(TestIds.common.bouncePlanTab);
      await TestActions.waitForElement(TestIds.bouncePlan.screen);

      // Try to tap future task
      const futureTa;

      Id = TestIds.bouncePlan.taskCard('day-7');
      
      // Should either not be visible or be disabled
      const exists = await TestActions.elementExists(futureTaskId);
      if (exists) {
        await expect(element(by.id(futureTaskId))).toHaveLabel('Locked');
      }
    });
  });

  describe('Offline Functionality', () => {
    it('should save task completion offline and sync when online', async () => {
      // Go offline
      await TestActions.disableNetwork();
      
      // Navigate to bounce plan
      await TestActions.tap(TestIds.common.bouncePlanTab);
      await TestActions.waitForElement(TestIds.bouncePlan.screen);
      
      // Verify offline indicator
      await TestActions.waitForElement(TestIds.bouncePlan.offlineIndicator);

      // Complete a task offline
      const todayTaskId = TestIds.bouncePlan.taskCard('day-1');
      await TestActions.tap(todayTaskId);
      await TestActions.tap(TestIds.bouncePlan.completeTaskButton);

      // Task should show as completed locally
      await expect(element(by.id(todayTaskId))).toHaveLabel('Completed');

      // Go back online
      await TestActions.enableNetwork();

      // Should automatically sync
      await TestActions.waitForElement(TestIds.bouncePlan.syncButton, 10000);
      
      // Verify sync completed
      await expect(element(by.id(TestIds.bouncePlan.offlineIndicator))).not.toBeVisible();
    });

    it('should handle sync conflicts gracefully', async () => {
      // This would test scenarios where the same task is modified offline on multiple devices
      // Implementation would involve simulating conflicting changes
    });
  });

  describe('Weekly Progress', () => {
    it('should display weekly progress dots correctly', async () => {
      await TestActions.tap(TestIds.common.bouncePlanTab);
      await TestActions.waitForElement(TestIds.bouncePlan.screen);
      
      // Verify weekly progress indicator
      await TestActions.waitForElement(TestIds.bouncePlan.weeklyProgress);
      
      // Should show 7 dots for the week
      for (let i = 0; i < 7; i++) {
        await expect(element(by.id(`progress-dot-${i}`))).toExist();
      }
    });
  });

  describe('Performance', () => {
    it('should load bounce plan screen quickly', async () => {
      const loadTime = await TestActions.measurePerformance(async () => {
        await TestActions.tap(TestIds.common.bouncePlanTab);
        await TestActions.waitForElement(TestIds.bouncePlan.screen);
        await TestActions.waitForLoadingToComplete();
      });

      expect(loadTime).toBeLessThan(TestData.performance.screenTransition);
    });
  });
});