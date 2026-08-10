import { test, expect } from '@playwright/test';

test.describe('Accessibility: skip link, focus rings, reduced motion', () => {
  test('skip link is keyboard-focusable and jumps to main content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toHaveText(/skip to main content/i);

    // Off-screen until focused (WCAG 2.4.1 bypass blocks)
    const hiddenBox = await skipLink.boundingBox();
    expect(hiddenBox?.width ?? 0).toBeLessThanOrEqual(1);

    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    const visibleBox = await skipLink.boundingBox();
    expect(visibleBox?.width ?? 0).toBeGreaterThan(1);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('desktop nav item shows a visible focus ring on keyboard focus', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab'); // first nav item

    const focused = page.locator(':focus');
    await expect(focused).toHaveClass(/nav-focus-target/);

    const outline = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('animations are disabled when prefers-reduced-motion is set', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const scrollBehavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior
    );
    expect(scrollBehavior).toBe('auto');
  });
});
