import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for dashboard to load
    await expect(page.getByText('Production Overview')).toBeVisible();
  });

  test('Category cycling behavior', async ({ page }) => {
    // Initial state: Production Overview
    await expect(page.getByRole('heading', { name: 'Production Overview' })).toBeVisible();

    // Check for a chart specific to Production (e.g., WIP by Stage)
    await expect(page.getByText('WIP by Stage')).toBeVisible();

    // Click Next Topic
    await page.getByRole('button', { name: 'Next Topic' }).click();

    // Expect change to Schedule & Lead Times
    await expect(page.getByRole('heading', { name: 'Schedule & Lead Times' })).toBeVisible();
    await expect(page.getByText('Lead Time Trend')).toBeVisible();

    // Click Next Topic again -> Sales & Customers
    await page.getByRole('button', { name: 'Next Topic' }).click();
    await expect(page.getByRole('heading', { name: 'Sales & Customers' })).toBeVisible();
    await expect(page.getByText('Pumps by Customer')).toBeVisible();
  });

  test('Add to favorites', async ({ page }) => {
    // Ensure we are on Production Overview
    await expect(page.getByRole('heading', { name: 'Production Overview' })).toBeVisible();

    // Find the "WIP by Stage" chart and its favorite button
    // The favorite button is the star icon button inside the chart card
    const chartCard = page.locator('.relative.rounded-3xl').filter({ hasText: 'WIP by Stage' });
    const favButton = chartCard.getByRole('button', { name: 'Toggle favorite' });

    // Click to favorite
    await expect(chartCard).toBeVisible();
    await expect(favButton).toBeVisible();
    await favButton.click();

    // Verify star is filled (indicating it was added)
    // The Star icon inside the button should have 'fill-current' class
    await expect(favButton.locator('.lucide-star')).toHaveClass(/fill-current/);

    // Click "Favorites" toggle in header
    await page.getByRole('button', { name: 'Favorites' }).click();

    // Verify button text changes to "Show Topic View"
    await expect(page.getByRole('button', { name: 'Show Topic View' })).toBeVisible();

    // Verify header changes to "My Dashboard"
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible();

    // Verify "WIP by Stage" is present
    await expect(page.getByText('WIP by Stage')).toBeVisible();

    // Verify other charts are NOT present (unless they were already favorites, but local storage should be clean in new context)
    // "Capacity by Department" is also in Production, but shouldn't be here if we only clicked WIP
    // Wait, Playwright context storage might persist if not configured otherwise. 
    // But usually new context = empty storage.
    await expect(page.getByText('Capacity by Department')).not.toBeVisible();

    // Unfavorite
    await page.getByRole('button', { name: 'Toggle favorite' }).click();

    // Should disappear from favorites view immediately? 
    // The code: setFavoriteChartIds(prev.filter...) -> chartIdsToRender updates -> AnimatePresence removes it.
    await expect(page.getByText('WIP by Stage')).not.toBeVisible();
  });

  test('Drill-down interaction', async ({ page }) => {
    // Navigate to Sales & Customers to find the Pie Chart
    await page.getByRole('button', { name: 'Next Topic' }).click(); // -> Schedule
    await page.getByRole('button', { name: 'Next Topic' }).click(); // -> Sales
    await expect(page.getByRole('heading', { name: 'Sales & Customers' })).toBeVisible();

    // Find "Pumps by Customer" chart
    const chartCard = page.locator('.relative.rounded-3xl').filter({ hasText: 'Pumps by Customer' });
    await expect(chartCard).toBeVisible();

    // Click a legend item to drill down
    const firstLegendItem = chartCard.locator('.chart-legend-row__item').first();
    const customerName = await firstLegendItem.locator('.chart-legend-row__label').textContent();

    // Wait for animation to settle
    await page.waitForTimeout(1000);

    // Click the label specifically
    await firstLegendItem.locator('.chart-legend-row__label').click({ force: true });

    // Verify Breadcrumb appears
    await expect(page.getByRole('button').filter({ hasText: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button').filter({ hasText: customerName! })).toBeVisible();

    // Verify view changed to "Pumps by Model" (next in sequence)
    await expect(page.getByRole('heading', { name: 'Pumps by Model' })).toBeVisible();

    // Drill down further: Click a model slice
    const modelChartCard = page.locator('.relative.rounded-3xl').filter({ hasText: 'Pumps by Model' });
    const firstModelLegendItem = modelChartCard.locator('.chart-legend-row__item').first();
    const modelName = await firstModelLegendItem.locator('.chart-legend-row__label').textContent();

    await firstModelLegendItem.click({ force: true });

    // Verify Breadcrumb: Dashboard > Customer > Model
    await expect(page.getByText(modelName!)).toBeVisible();

    // Verify view changed to "Detailed Pump List" (Table)
    await expect(page.getByRole('heading', { name: 'Detailed Pump List' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    // Click Dashboard breadcrumb to go back
    await page.getByRole('button').filter({ hasText: 'Dashboard' }).click();

    // Verify back to original view
    await expect(page.getByRole('heading', { name: 'Sales & Customers' })).toBeVisible();
    await expect(page.getByRole('button').filter({ hasText: 'Dashboard' })).not.toBeVisible();
  });
});
