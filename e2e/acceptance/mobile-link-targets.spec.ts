import { test, expect } from '@playwright/test';

test.describe('Mobile link touch targets', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('visible ordinary mobile links meet the 44px target without horizontal overflow', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');

    const failures = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLAnchorElement>('a.mobile-link-target'))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: (element.textContent || element.getAttribute('aria-label') || element.href).trim().replace(/\s+/g, ' '),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            visible: rect.width > 0 && rect.height > 0,
          };
        })
        .filter(({ visible }) => visible)
        .filter(({ width, height }) => width < 44 || height < 44);
    });

    expect(failures).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
