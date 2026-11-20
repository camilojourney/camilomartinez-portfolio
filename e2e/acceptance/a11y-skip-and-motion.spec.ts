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

  // About exercises the same server-rendered reveal wrappers as the populated
  // fitness dashboard, without requiring private health records in the test DB.
  for (const theme of ['light', 'dark']) {
    for (const reducedMotion of ['reduce', 'no-preference'] as const) {
      test(`server-rendered sections stay painted in ${theme} with ${reducedMotion} motion`, async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text());
        });
        page.on('pageerror', (error) => errors.push(error.message));
        await page.emulateMedia({ reducedMotion });
        await page.addInitScript((theme) => localStorage.setItem('theme', theme), theme);
        await page.goto('/about');

        for (const name of ['The real version', 'Timeline', 'What I build with', 'How I work', 'Ask me anything']) {
          const heading = page.getByRole('heading', { name, exact: true });
          await heading.scrollIntoViewIfNeeded();
          await expect(heading).toBeVisible();
          // Playwright's visibility check allows opacity: 0, including on ancestors.
          await expect.poll(() => heading.evaluate((element) => {
            let opacity = 1;
            for (let node: Element | null = element; node; node = node.parentElement) {
              opacity *= Number(getComputedStyle(node).opacity);
            }
            return opacity;
          }), { message: `${name} must actually be painted after scrolling` }).toBe(1);
        }

        expect(errors).toEqual([]);
      });
    }
  }

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
