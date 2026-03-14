import { test, expect } from '@playwright/test';

test.describe('About & Chatbot', () => {
  test('AC-018: About page loads', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Juan Camilo Martinez/);
    await expect(page.getByRole('heading', { name: 'About Me' })).toBeVisible();
  });

  test('AC-026: Chatbot renders on about page', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    // ChatWidget is a floating button — click to open, then check input appears
    const chatButton = page.getByRole('button', { name: /Chat with AI assistant/i });
    await expect(chatButton).toBeVisible({ timeout: 10000 });
    await chatButton.click();
    await expect(page.getByPlaceholder(/Ask anything/i)).toBeVisible();
  });
});

test.describe('About Page Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('AC-028: About page on mobile', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Juan Camilo Martinez/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
