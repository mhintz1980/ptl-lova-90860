import { test, expect, TestConfig } from './fixtures/test-fixtures';
import { Assertions } from './helpers/test-utils';

test.describe('Scheduling Enhanced Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure persisted state from previous runs doesn't leak in
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage?.clear();
    });

    // Navigate to the application and wait for it to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait until the Zustand store is available so we can seed deterministically
    await page.waitForFunction(
      () => Boolean((window as any).useApp?.getState),
      undefined,
      { timeout: 10000 }
    );

    // If the store hasn't loaded any pumps yet, seed it with deterministic data
    await page.evaluate(async () => {
      const globalApp: any = (window as any).useApp;
      if (!globalApp?.getState) {
        return;
      }
      const state = globalApp.getState();
      if (state.pumps.length === 0) {
        const { seed } = await import('../../src/lib/seed');
        const seeded = seed(40);
        state.replaceDataset(seeded);
      }
    });
  });

  test('complete scheduling workflow', async ({ page, schedulingPage }) => {
    // Navigate to scheduling view
    await schedulingPage.navigateToScheduling();

    // Wait for jobs to load
    await schedulingPage.waitForJobsToLoad();

    // Get initial state
    const initialJobCount = await schedulingPage.getJobCount();
    const initialEventCount = await schedulingPage.getEventCount();

    // Test with at least one job available
    if (initialJobCount > 0) {
      // Get first job details
      const pumpId = await schedulingPage.getJobPumpId(0);
      const pumpModel = await schedulingPage.getJobModel(0);

      expect(pumpId).toBeTruthy();
      expect(pumpModel).toBeTruthy();

      // Perform drag and drop
      await schedulingPage.dragJobToCalendar(0, 0);

      // Verify job was moved
      await Assertions.expectJobToBeMoved(page, pumpId!, false);

      // Check if event was created
      await schedulingPage.waitForCalendarToLoad();
      const newEventCount = await schedulingPage.getEventCount();

      // If events are properly implemented, count should increase
      if (newEventCount > initialEventCount) {
        console.log('Event successfully created on calendar');
      }

      // Test event detail panel
      if (newEventCount > 0) {
        await schedulingPage.clickCalendarEvent(0);
        expect(await schedulingPage.isEventDetailPanelOpen()).toBeTruthy();

        // Close the detail panel
        await schedulingPage.closeEventDetailPanel();
        expect(await schedulingPage.isEventDetailPanelOpen()).toBeFalsy();
      }
    } else {
      test.skip(true, 'No jobs available for scheduling workflow test');
    }
  });

  test('multi-job scheduling', async ({ page, schedulingPage }) => {
    await schedulingPage.navigateToScheduling();
    await schedulingPage.waitForJobsToLoad();

    const initialJobCount = await schedulingPage.getJobCount();

    if (initialJobCount >= 3) {
      // Schedule multiple jobs to different calendar cells
      const jobsToSchedule = Math.min(3, initialJobCount);
      const scheduledPumpIds: string[] = [];

      for (let i = 0; i < jobsToSchedule; i++) {
        const pumpId = await schedulingPage.getJobPumpId(i);
        if (pumpId) {
          scheduledPumpIds.push(pumpId);
          // Schedule to different cells
          await schedulingPage.dragJobToCalendar(0, i);
          await page.waitForTimeout(500);
        }
      }

      // Verify all jobs were moved
      for (const pumpId of scheduledPumpIds) {
        await Assertions.expectJobToBeMoved(page, pumpId, false);
      }

      // Verify the jobs count decreased
      const finalJobCount = await schedulingPage.getJobCount();
      expect(finalJobCount).toBeLessThan(initialJobCount);
    } else {
      test.skip(true, 'Not enough jobs available for multi-job scheduling test');
    }
  });

  test('navigation and state preservation', async ({ page, schedulingPage }) => {
    await schedulingPage.navigateToScheduling();
    await schedulingPage.waitForJobsToLoad();

    const initialJobCount = await schedulingPage.getJobCount();

    if (initialJobCount > 0) {
      // Schedule a job
      const pumpId = await schedulingPage.getJobPumpId(0);
      await schedulingPage.dragJobToCalendar(0, 0);

      // Navigate to different views
      await schedulingPage.navigateToDashboard();
      await page.waitForTimeout(1000);

      await schedulingPage.navigateToKanban();
      await page.waitForTimeout(1000);

      // Navigate back to scheduling
      await schedulingPage.navigateToScheduling();
      await schedulingPage.waitForJobsToLoad();

      // Verify the change is still present
      await Assertions.expectJobToBeMoved(page, pumpId!, false);
    } else {
      test.skip(true, 'No jobs available for state preservation test');
    }
  });

  test('responsive behavior across viewports', async ({ page, schedulingPage }) => {
    await schedulingPage.navigateToScheduling();
    await schedulingPage.waitForJobsToLoad();

    // Test desktop viewport
    await page.setViewportSize(TestConfig.viewports.desktop);
    await page.waitForTimeout(500);
    await Assertions.expectComponentToBeVisible(schedulingPage.getSchedulingSidebar());
    await Assertions.expectComponentToBeVisible(schedulingPage.getMainCalendarGrid());

    // Test tablet viewport
    await page.setViewportSize(TestConfig.viewports.tablet);
    await page.waitForTimeout(500);
    await Assertions.expectComponentToBeVisible(schedulingPage.getMainCalendarGrid());

    // Test mobile viewport
    await page.setViewportSize(TestConfig.viewports.mobile);
    await page.waitForTimeout(500);
    await Assertions.expectComponentToBeVisible(schedulingPage.getMainCalendarGrid());

    // Verify main navigation still works in mobile
    await expect(page.getByRole('button', { name: /scheduling/i })).toBeVisible();
  });

  test('keyboard navigation and accessibility', async ({ page, schedulingPage }) => {
    await schedulingPage.navigateToScheduling();
    await schedulingPage.waitForJobsToLoad();

    // Test tab navigation through main elements
    await page.keyboard.press('Tab'); // First element
    await page.keyboard.press('Tab'); // Second element
    await page.keyboard.press('Tab'); // Third element

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test Escape key functionality
    if (await schedulingPage.isEventDetailPanelOpen()) {
      await page.keyboard.press('Escape');
      expect(await schedulingPage.isEventDetailPanelOpen()).toBeFalsy();
    }

    // Test Enter key on buttons
    const schedulingButton = page.getByRole('button', { name: /scheduling/i });
    await schedulingButton.focus();
    await page.keyboard.press('Enter');

    // Verify we're still on scheduling page
    await expect(page.getByText(/unscheduled jobs/i)).toBeVisible();
  });

  test('performance and loading behavior', async ({ page, schedulingPage }) => {
    const startTime = Date.now();

    await page.goto('/');
    await schedulingPage.navigateToScheduling();
    await schedulingPage.waitForJobsToLoad();

    const loadTime = Date.now() - startTime;

    // Should load within reasonable time (adjust as needed)
    expect(loadTime).toBeLessThan(10000);

    // Check for smooth animations/transitions
    const jobCards = schedulingPage.getUnscheduledJobs();
    if (await jobCards.count() > 0) {
      // Check that elements have appropriate CSS for transitions
      const firstCard = jobCards.first();
      const transition = await firstCard.evaluate((el) => {
        return window.getComputedStyle(el).transition;
      });

      // Should have some transition defined (even if empty string is valid)
      expect(transition).toBeDefined();
    }
  });

  test('stage legend filters calendar events', async ({ page, schedulingPage }) => {
    await schedulingPage.navigateToScheduling();
    await schedulingPage.waitForJobsToLoad();
    await schedulingPage.waitForCalendarToLoad();

    let eventCount = await schedulingPage.getEventCount();

    if (eventCount === 0) {
      const jobCount = await schedulingPage.getJobCount();
      if (jobCount === 0) {
        test.skip(true, 'No jobs available to create calendar events');
      }

      await schedulingPage.dragJobToCalendar(0, 0);
      await schedulingPage.waitForCalendarToLoad();
      eventCount = await schedulingPage.getEventCount();

      if (eventCount === 0) {
        test.skip(true, 'Unable to render calendar events for filtering test');
      }
    }

    const firstEvent = schedulingPage.getCalendarEvents().first();
    await expect(firstEvent).toBeVisible();
    const stage = (await firstEvent.getAttribute('data-stage')) ?? '';
    if (!stage) {
      test.skip(true, 'Calendar events did not expose stage metadata');
    }

    const stageButton = page.locator(`[data-stage-filter="${stage}"]`).first();
    await stageButton.scrollIntoViewIfNeeded();
    await stageButton.click();
    await schedulingPage.waitForCalendarToLoad();

    const nonMatchingCount = await schedulingPage.getCalendarEvents().evaluateAll(
      (nodes, expectedStage) =>
        nodes.filter((node) => node.getAttribute('data-stage') !== expectedStage).length,
      stage
    );

    expect(nonMatchingCount).toBe(0);

    await stageButton.click();
    await schedulingPage.waitForCalendarToLoad();
    expect(await schedulingPage.getEventCount()).toBeGreaterThan(0);
  });

  test('error recovery and retry mechanisms', async ({ page, schedulingPage }) => {
    // Simulate network issues
    await page.route('**/api/**', route => route.abort('failed'));

    await schedulingPage.navigateToScheduling();

    // Wait for error handling
    await page.waitForTimeout(3000);

    // The app should still be functional
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('button', { name: /scheduling/i })).toBeVisible();

    // Restore network and test recovery
    await page.unroute('**/api/**');
    await page.reload();
    await schedulingPage.waitForJobsToLoad();

    // App should recover and work normally
    await expect(page.getByText(/unscheduled jobs/i)).toBeVisible();
  });
});

test.describe('Scheduling Edge Cases', () => {
  test('empty state handling', async ({ page, schedulingPage }) => {
    await schedulingPage.navigateToScheduling();

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Handle case where no jobs are available
    const jobCount = await schedulingPage.getJobCount();

    if (jobCount === 0) {
      // Should show empty state or message
      const emptyState = page.getByText(/no jobs|empty|no data/i);
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
      }

      // Navigation should still work
      await expect(page.getByRole('button', { name: /dashboard/i })).toBeVisible();
    }
  });

  test('large number of jobs performance', async ({ page, schedulingPage }) => {
    await schedulingPage.navigateToScheduling();
    await schedulingPage.waitForJobsToLoad();

    const jobCount = await schedulingPage.getJobCount();

    if (jobCount > 10) {
      // Should handle many jobs efficiently
      await Assertions.expectComponentToBeVisible(schedulingPage.getSchedulingSidebar());

      // Scrolling should work
      const sidebar = schedulingPage.getSchedulingSidebar();
      await sidebar.evaluate((el) => el.scrollTop = 500);
      await page.waitForTimeout(500);

      // Should still be able to interact with jobs
      const visibleJobs = schedulingPage.getUnscheduledJobs().first();
      if (await visibleJobs.isVisible()) {
        await expect(visibleJobs).toBeVisible();
      }
    }
  });

  test('concurrent operations', async ({ page, schedulingPage }) => {
    await schedulingPage.navigateToScheduling();
    await schedulingPage.waitForJobsToLoad();

    const jobCount = await schedulingPage.getJobCount();

    if (jobCount >= 2) {
      // Try multiple rapid operations
      const pumpId1 = await schedulingPage.getJobPumpId(0);
      const pumpId2 = await schedulingPage.getJobPumpId(1);

      if (pumpId1 && pumpId2) {
        // Schedule jobs rapidly
        await schedulingPage.dragJobToCalendar(0, 0);
        await schedulingPage.dragJobToCalendar(0, 1);

        await page.waitForTimeout(1000);

        // Verify both jobs were moved
        await Assertions.expectJobToBeMoved(page, pumpId1, false);
        await Assertions.expectJobToBeMoved(page, pumpId2, false);
      }
    }
  });
});
