import { test, expect } from '@playwright/test';

test.describe('Settings and Scheduling Capacity', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Settings modal - man-hours display', async ({ page }) => {
        // Open Settings
        await page.getByLabel('Open settings').click();
        await expect(page.getByText('System Settings')).toBeVisible();

        // Check Fabrication section
        const fabSection = page.locator('div', { hasText: 'Fabrication' }).first();
        await expect(fabSection).toBeVisible();

        // Check Employees input
        const employeesInput = fabSection.locator('input[type="number"]');
        await expect(employeesInput).toBeVisible();
        await expect(employeesInput).toHaveValue('4'); // Default

        // Check Man-Hours display
        // Assuming 4 employees * 8 hours = 32 man-hours
        const text = await fabSection.textContent();
        console.log('Fab Section Text:', text);
        await expect(fabSection.getByText('32 Man-Hours')).toBeVisible();
    });

    test('Scheduling - Fabrication capacity respects man-hours', async ({ page }) => {
        // 1. Configure Capacity: Set Fabrication to 1 employee (8 man-hours/day)
        await page.getByLabel('Open settings').click();
        const fabSection = page.locator('div', { hasText: 'Fabrication' }).first();
        const employeesInput = fabSection.locator('input[type="number"]');
        await employeesInput.fill('1');
        await page.getByRole('button', { name: 'Done' }).click();

        // 2. Go to Scheduling View
        await page.getByLabel('Go to Scheduling').click();
        await expect(page.getByTestId('scheduling-view')).toBeVisible();

        // 3. Identify target date (Next Monday)
        // We need a date that is a weekday.
        // Let's pick a date from the calendar headers.
        // The calendar shows 6 weeks.
        // We'll just grab the first Monday in the view.
        // The headers have text like "Mon 24".
        // We can find a cell with data-testid="calendar-cell-YYYY-MM-DD".
        // We'll just pick the first cell in the second row (usually a Monday if view starts on Mon).
        // Actually, MainCalendarGrid computes viewStart as start of week.
        // So the first cell (index 0) is Monday.
        const firstCell = page.locator('.calendar-cell').first();
        const targetDateId = await firstCell.getAttribute('data-testid');
        const targetDate = targetDateId?.replace('calendar-cell-', '');

        console.log(`Targeting date: ${targetDate}`);

        // 4. Find 4 pumps to schedule
        // We need pumps that are in QUEUE.
        // The BacklogDock shows them.
        const backlogCards = page.locator('[data-testid^="pump-card-"]');
        await expect(backlogCards.first()).toBeVisible();
        const count = await backlogCards.count();
        expect(count).toBeGreaterThanOrEqual(4);

        // 5. Drag and Drop 4 pumps to the same day
        for (let i = 0; i < 4; i++) {
            const card = backlogCards.nth(0); // Always take the first one as they disappear from backlog? 
            // Actually, they might stay in backlog if they are just "scheduled" but not "started"?
            // In this app, scheduling moves them to "Scheduled Queue" but they might disappear from BacklogDock if it filters out scheduled ones.
            // Let's assume they disappear or move.
            // We'll re-query or just grab nth(0) each time.

            await card.dragTo(firstCell);

            // Wait for update
            await page.waitForTimeout(500);
        }

        // 6. Verify they don't all finish on the same day
        // With 1 employee (8h capacity) and 4 pumps (assuming ~1.5 days each = 12h each).
        // Total work = 48h.
        // Daily capacity = 8h.
        // Duration should be 6 days.
        // So the bars should span multiple days.
        // And they should NOT all look identical (unless they are stacked).
        // But if they are stacked, they are all starting on Monday.
        // The requirement is "they must not all start AND finish on that same day".
        // If they span 6 days, they finish next week.
        // So we check the width of the bars or the end date.

        // We can check the CalendarEvents.
        // They have data-testid or we can inspect their style/grid-column.
        // MainCalendarGrid renders them with `grid-column: span X`.
        // We expect span > 1.

        const events = page.locator('[data-testid="calendar-event"]');
        // Wait for events to appear
        try {
            await expect(events.first()).toBeVisible({ timeout: 5000 });
        } catch {
            console.log('Events not visible');
            const pageContent = await page.content();
            console.log('Page Content Length:', pageContent.length);
        }

        const eventCount = await events.count();
        console.log('Event Count:', eventCount);
        expect(eventCount).toBeGreaterThanOrEqual(4);

        if (eventCount > 0) {
            const firstEvent = events.first();
            const span = await firstEvent.getAttribute('data-span');
            console.log('First Event Span:', span);
            await expect(firstEvent).toHaveAttribute('data-span', /^[2-9]$|^1[0-9]$/); // Expect span >= 2
        }
    });
});
