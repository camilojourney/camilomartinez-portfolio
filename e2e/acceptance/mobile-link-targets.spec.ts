import { test, expect } from '@playwright/test';

for (const width of [390, 1024]) {
  test.describe(`Touch targets at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 }, hasTouch: true });

    for (const route of [
      '/',
      '/projects',
      '/about',
      '/contact',
      '/blog',
      '/apps',
      '/tools',
      '/bookshelf',
      '/apps/fitness-dashboard',
      '/apps/accountability-partner',
      '/projects/social-media-pipeline',
      '/apps/focus-time',
      '/projects/focus-time',
      '/projects/hrv-research',
      '/projects/nlp-data-science',
      '/projects/holus',
      '/projects/holus-observatory',
      '/projects/holusight',
    ]) {
      test(`${route} has 44px links and controls without horizontal overflow`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const failures = await page.evaluate(() => {
          return Array.from(document.querySelectorAll<HTMLElement>('main a, a.mobile-link-target, a.btn-primary, a.btn-secondary, a.btn-accent, button, [role="button"], input[type="submit"], input[type="button"]'))
            .filter((element) => {
              if (element.tagName !== 'A') return true;
              const parent = element.parentElement;
              const inSentence = parent?.matches('p, .prose li')
                && Array.from(parent.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
              return !inSentence;
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                text: (element.getAttribute('aria-label') || element.textContent || element.getAttribute('href') || element.tagName).trim().replace(/\s+/g, ' '),
                width: rect.width,
                height: rect.height,
                visible: rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden',
              };
            })
            .filter(({ visible }) => visible)
            .filter(({ width, height }) => width < 44 || height < 44);
        });

        expect(failures).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      });
    }
  });
}
