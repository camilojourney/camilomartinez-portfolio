import { test, expect, type Locator } from '@playwright/test';

async function expectContrast(text: Locator, background: Locator) {
  await expect(text).toHaveCSS('text-decoration-line', 'underline');
  const backgroundColor = await background.evaluate((element) => getComputedStyle(element).backgroundColor);
  const ratio = await text.evaluate((element, backdrop) => {
    const luminance = (color: string) => {
      const channels = (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
    };
    const foreground = luminance(getComputedStyle(element).color);
    const background = luminance(backdrop);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  }, backgroundColor);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
}

for (const key of ['Enter', 'Space']) {
  test(`keyboard ${key} dismisses the teaser without opening chat`, async ({ page }) => {
    await page.goto('/');
    const dismiss = page.getByRole('button', { name: 'Dismiss', exact: true });
    await dismiss.focus();
    await dismiss.press(key);
    await expect(dismiss).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Chat with AI assistant', exact: true })).toBeVisible();
  });
}

test('keyboard activation of the teaser still opens chat', async ({ page }) => {
  await page.goto('/');
  const teaser = page.getByRole('button', { name: /Built a speech ML pipeline from 46 papers/ });
  await teaser.focus();
  await teaser.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('Escape cancels a pending chat and allows another question', async ({ page }) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  let requests = 0;
  await page.route('**/api/chat', async (route) => {
    requests += 1;
    if (requests === 1) {
      await pending;
      await route.abort().catch(() => {});
      return;
    }
    await route.fulfill({
      contentType: 'text/event-stream',
      body: 'data: {"content":"Ready for another question."}\n\ndata: [DONE]\n\n',
    });
  });

  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Chat with AI assistant', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Your question' });
    await input.fill('Tell me about your work');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await expect(input).toBeDisabled();
    await expect.poll(() => requests).toBe(1);
    await page.getByRole('dialog').getByRole('button', { name: 'Close chat', exact: true }).focus();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Chat with AI assistant', exact: true }).click();
    await expect(input).toBeEnabled();
    await expect(page.getByLabel('Thinking', { exact: true })).toHaveCount(0);
    release();
    await input.fill('Another question');
    await input.press('Enter');
    await expect(page.getByRole('dialog')).toContainText('Ready for another question.');
    await expect(input).toBeEnabled();
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} semantic text pairs and rendered chat links retain AA contrast`, async ({ page }) => {
    await page.route('**/api/chat', (route) => route.fulfill({
      contentType: 'text/event-stream',
      body: 'data: {"content":"See [my work](/projects)."}\n\ndata: [DONE]\n\n',
    }));
    await page.goto('/');
    await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), theme);

    const pairs = await page.evaluate(() => {
      const fixture = document.createElement('div');
      fixture.id = 'contrast-contract';
      const pairs: Array<{ foreground: string; background: string; ratio: number }> = [];
      const measure = (foreground: string, background: string) => {
        const surface = document.createElement('div');
        const label = document.createElement('span');
        surface.style.backgroundColor = `rgb(var(--${background}))`;
        label.style.color = foreground === 'sh-comment' ? 'var(--sh-comment)' : `rgb(var(--${foreground}))`;
        label.textContent = foreground;
        surface.append(label);
        fixture.append(surface);
        const luminance = (color: string) => {
          const channels = (color.match(/[\d.]+/g) || []).slice(0, 3).map(Number).map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
        };
        const a = luminance(getComputedStyle(label).color);
        const b = luminance(getComputedStyle(surface).backgroundColor);
        pairs.push({ foreground, background, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) });
      };
      document.body.append(fixture);
      for (const background of ['page', 'surface', 'surface-2']) {
        for (const foreground of ['ink', 'muted', 'accent', 'live', 'warn', 'danger', 'sh-comment']) {
          measure(foreground, background);
        }
      }
      measure('page', 'ink');
      measure('accent-ink', 'accent');
      fixture.remove();
      return pairs;
    });
    expect(pairs.filter(({ ratio }) => ratio < 4.5)).toEqual([]);

    await page.getByRole('button', { name: 'Chat with AI assistant', exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Your question' });
    await input.fill('Please review https://example.com');
    await input.press('Enter');
    const user = page.locator('[data-chat-message-role="user"]').last();
    const assistant = page.locator('[data-chat-message-role="assistant"]').last();
    await expect(assistant.getByRole('link', { name: 'my work' })).toBeVisible();
    await expectContrast(user.getByRole('link'), user);
    await expectContrast(assistant.getByRole('link'), assistant);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `test-results/review-chat-${theme}.png` });
  });
}

test('Focus Time retains its benefit and preview content', async ({ page }) => {
  await page.goto('/apps/focus-time');
  for (const heading of ['Boost Awareness', 'Sharpen Focus', 'Enhance Insights', 'App Preview']) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByText('Periodic check-ins every 15 minutes', { exact: true })).toBeVisible();
  await expect(page.getByText('Stay grounded during hyperfocus', { exact: true })).toBeVisible();
  await expect(page.getByText('Review your focus patterns', { exact: true })).toBeVisible();
  await expect(page.getByText('Check-in ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to Windows', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Download for Windows', exact: true })).toHaveAttribute('href', '/downloads/focus-time-windows.exe');
});
