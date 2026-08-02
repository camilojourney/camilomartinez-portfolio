import { test, expect } from '@playwright/test';

test.describe('About & Chatbot', () => {
  test('AC-018: About page loads', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Juan Camilo Martinez/);
    await expect(page.getByRole('heading', { name: 'About Camilo' })).toBeVisible();
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

  test('recruiter fallback: Chatbot gives a conversion-useful recovery when chat API is unavailable', async ({ page }) => {
    await page.route('**/api/chat', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'service unavailable' }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const chatWidget = page.locator('[data-chat-widget]');
    await page.getByRole('button', { name: /Chat with AI assistant/i }).click();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();

    const input = page.getByPlaceholder(/Ask anything/i);
    await input.fill('Are you available for an AI Engineer interview?');
    await input.press('Enter');

    await expect(chatWidget).toContainText(/AI service is unavailable|AI service.*temporarily unavailable/i);
    await expect(chatWidget).toContainText(/open to Applied AI Engineer roles/i);
    await expect(chatWidget).toContainText(/NYC|New York/i);
    await expect(chatWidget).toContainText(/remote\/hybrid|remote or hybrid|hybrid.*remote/i);

    const emailLink = chatWidget.getByRole('link', { name: /juancamilomabe@gmail\.com/i });
    await expect(emailLink).toHaveAttribute('href', /^mailto:juancamilomabe@gmail\.com(?:\?|$)/);
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
