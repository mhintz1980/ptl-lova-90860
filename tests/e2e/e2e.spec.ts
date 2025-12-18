import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:5173/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/pumptracker-lite/);
});

test('navigate to scheduling page', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:5173/');


  // Click the scheduling button.
  await page.getByRole('button', { name: /Scheduling/ }).click();

  // Expect the URL to be the scheduling page.
  await expect(page).toHaveURL(/.*\/scheduling/);

  // Expect the "Today" button to be visible.
  await expect(page.getByRole('button', { name: /Today/ })).toBeVisible();
});
