import { test, expect } from '@playwright/test';

test('portfolio home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Camilo/i);
});
