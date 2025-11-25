import { test, expect } from '@playwright/test';

test('Department Staffing and Capacity Calculation', async ({ page }) => {
    // 1. Navigate to the app
    await page.goto('/');
    // Clear storage to ensure fresh state
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Open Settings Modal
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Department Staffing')).toBeVisible();

    // 3. Locate Fabrication inputs
    // We need to be careful with selectors since we have multiple inputs
    // The structure is: Fabrication Card -> Employees Input, Efficiency Input, Man-Hours Input

    // Find the container for Fabrication
    const fabCard = page.locator('div').filter({ hasText: 'Fabrication' }).filter({ hasText: '~4 days/pump' }).first();

    const employeesInput = fabCard.locator('input').nth(0);
    const efficiencyInput = fabCard.locator('input').nth(1);
    const manHoursInput = fabCard.locator('input').nth(2);

    // 4. Verify Initial State (Defaults)
    // Employees: 4
    // Efficiency: 85%
    // Man-Hours: 4 * 8 * 0.85 = 27.2
    await expect(employeesInput).toHaveValue('4');
    await expect(efficiencyInput).toHaveValue('85');
    await expect(manHoursInput).toHaveValue('27.2');

    // 5. Change Employees to 10
    await employeesInput.fill('10');
    // Trigger change event if needed, usually fill does it

    // Verify Man-Hours updates: 10 * 8 * 0.85 = 68
    await expect(manHoursInput).toHaveValue('68');

    // 6. Change Efficiency to 100%
    await efficiencyInput.fill('100');

    // Verify Man-Hours updates: 10 * 8 * 1.0 = 80
    await expect(manHoursInput).toHaveValue('80');

    // 7. Change Man-Hours to 40
    await manHoursInput.fill('40');

    // Verify Efficiency updates: 40 / (10 * 8) = 0.5 = 50%
    await expect(efficiencyInput).toHaveValue('50');

    // 8. Close Modal
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText('Department Staffing')).not.toBeVisible();

    // 9. Verify persistence (re-open modal)
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(employeesInput).toHaveValue('10');
    await expect(efficiencyInput).toHaveValue('50');
    await expect(manHoursInput).toHaveValue('40');
});
