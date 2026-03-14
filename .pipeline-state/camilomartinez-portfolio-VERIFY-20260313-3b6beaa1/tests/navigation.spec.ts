import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('AC-017: Projects grid → case study → back', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    // Find the Holus Observatory "Read case study" link
    const observatoryLink = page.locator('a[href="/projects/holus-observatory"]').filter({ hasText: 'Read case study' });
    await observatoryLink.click();
    await expect(page).toHaveURL(/\/projects\/holus-observatory/);
    await page.getByRole('link', { name: /Back to Projects|← Projects|All Projects/i }).click();
    await expect(page).toHaveURL(/\/projects/);
  });
});
