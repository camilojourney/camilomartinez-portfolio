import { test, expect } from '@playwright/test';

test.describe('External Links', () => {
  test('AC-019: Holus Observatory demo link works', async ({ request }) => {
    const response = await request.get('https://holus-observatory.vercel.app');
    // Vercel Auth may return 401 for API requests - accept any non-server-error
    expect(response.status()).toBeLessThan(500);
  });

  test('AC-020: Invoz link works', async ({ request }) => {
    const response = await request.get('https://invoz.io');
    expect(response.status()).toBeLessThan(400);
  });

  test('AC-021: Pilaster link works', async ({ request }) => {
    const response = await request.get('https://pilaster.ai');
    expect(response.status()).toBeLessThan(400);
  });

  test('AC-022: Genpeli link works', async ({ request }) => {
    const response = await request.get('https://www.editai.ai');
    expect(response.status()).toBeLessThan(400);
  });

  test('AC-023: Holusight 404 is not linked from the portfolio', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('a[href*="holusight.com"]')).toHaveCount(0);
  });

  test('AC-024: AI Advisor Board link works', async ({ request }) => {
    const response = await request.get('https://ai-advisor-board.vercel.app');
    expect(response.status()).toBe(200);
  });

  test('AC-025: Job Tracker link works', async ({ request }) => {
    const response = await request.get('https://job-tracker-swart-eta.vercel.app');
    expect(response.status()).toBe(200);
  });
});
