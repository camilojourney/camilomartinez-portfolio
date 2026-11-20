import { test, expect } from '@playwright/test';

test.describe('Entangled Bloch spheres (Concept 4) on home page', () => {
  test('renders inline in Selected work header on desktop, animates over time, and makes no WHOOP requests', async ({ page }) => {
    const whoopRequests: string[] = [];
    const errors: string[] = [];
    page.on('request', (req) => {
      if (req.url().toLowerCase().includes('whoop')) whoopRequests.push(req.url());
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const widget = page.getByTestId('entangled-bloch-spheres');
    await widget.scrollIntoViewIfNeeded();
    await expect(widget).toBeVisible();

    const button = widget.getByRole('button');
    const heading = page.getByRole('heading', { name: 'Selected work', exact: true });
    const caption = page.getByText('Production systems, research to deployment', { exact: true });

    const [headBox, btnBox, capBox] = await Promise.all([
      heading.boundingBox(),
      button.boundingBox(),
      caption.boundingBox(),
    ]);
    expect(headBox).not.toBeNull();
    expect(btnBox).not.toBeNull();
    expect(capBox).not.toBeNull();

    // Desktop 3-column layout: heading | spheres | caption
    expect(btnBox!.x).toBeGreaterThan(headBox!.x + headBox!.width - 2);
    expect(capBox!.x).toBeGreaterThan(btnBox!.x + btnBox!.width - 2);
    expect(Math.round(btnBox!.height)).toBe(120);

    // Spheres render at 80px diameter (r = 40) on desktop
    const radii = await widget.locator('circle.entangled-sphere').evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('r'))),
    );
    expect(radii).toEqual([40, 40]);

    // Wave animates over time when reduced motion is not set
    const wave = widget.locator('path.entangled-wave');
    const firstD = await wave.getAttribute('d');
    expect(firstD).toBeTruthy();
    await page.waitForTimeout(250);
    const laterD = await wave.getAttribute('d');
    expect(laterD).not.toBe(firstD);

    expect(whoopRequests).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('stays visible and stacks under Selected work below 600px with 60px spheres and zero overflow', async ({ page }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const widget = page.getByTestId('entangled-bloch-spheres');
      await widget.scrollIntoViewIfNeeded();
      await expect(widget).toBeVisible();

      const heading = page.getByRole('heading', { name: 'Selected work', exact: true });
      const button = widget.getByRole('button');

      const [headBox, btnBox] = await Promise.all([
        heading.boundingBox(),
        button.boundingBox(),
      ]);
      expect(headBox).not.toBeNull();
      expect(btnBox).not.toBeNull();

      // Stacked vertically below Selected work heading, 96px tall, 60px diameter spheres
      expect(btnBox!.y).toBeGreaterThanOrEqual(headBox!.y + headBox!.height);
      expect(Math.round(btnBox!.height)).toBe(96);
      expect(btnBox!.width).toBeGreaterThanOrEqual(width - 48);

      const radii = await widget.locator('circle.entangled-sphere').evaluateAll((els) =>
        els.map((el) => Number(el.getAttribute('r'))),
      );
      expect(radii).toEqual([30, 30]);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
    }
  });

  test('responds to pointer steering, click measurement, and keyboard rotation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const widget = page.getByTestId('entangled-bloch-spheres');
    await widget.scrollIntoViewIfNeeded();
    const button = widget.getByRole('button');
    const box = await button.boundingBox();
    expect(box).not.toBeNull();

    // Pointer near sphere A swells the wave and highlights spheres
    await page.mouse.move(box!.x + 52, box!.y + 54);
    await expect.poll(() =>
      widget.locator('circle.entangled-sphere').first().getAttribute('data-hot'),
    ).toBe('true');

    // Click measures the entangled pair and records opposite outcomes
    const status = widget.getByRole('status');
    await expect(status).toHaveText('Click to measure the pair.');

    await button.click();
    await expect(status).toContainText(/^Pair 1: A \|[01]⟩, B \|[01]⟩ \(P\(A=0\) was \d+%\)\. 1 pair measured, opposite every time\.$/);
    const firstOutcome = await status.textContent();
    expect(firstOutcome).toMatch(/A \|0⟩, B \|1⟩|A \|1⟩, B \|0⟩/);

    // Keyboard focus via Tab shows a visible cobalt focus ring, and Arrow/Enter controls work
    await page.getByLabel('At a glance').getByRole('link', { name: /juancamilomabe@gmail\.com/i }).focus();
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    const outlineStyle = await button.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe('none');

    await button.press('ArrowDown');
    await button.press('ArrowRight');
    await button.press('Enter');
    await expect(status).toContainText(/^Pair 2: A \|[01]⟩, B \|[01]⟩ \(P\(A=0\) was \d+%\)\. 2 pairs measured, opposite every time\.$/);
  });

  test('holds a still frame under prefers-reduced-motion while remaining interactive', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const widget = page.getByTestId('entangled-bloch-spheres');
    await widget.scrollIntoViewIfNeeded();
    const wave = widget.locator('path.entangled-wave');
    const vecA = widget.locator('line.entangled-vec').first();

    const waveBefore = await wave.getAttribute('d');
    const vecBefore = `${await vecA.getAttribute('x2')},${await vecA.getAttribute('y2')}`;
    await page.waitForTimeout(450);
    const waveAfter = await wave.getAttribute('d');
    const vecAfter = `${await vecA.getAttribute('x2')},${await vecA.getAttribute('y2')}`;

    expect(waveAfter).toBe(waveBefore);
    expect(vecAfter).toBe(vecBefore);

    // Steering and measurement still work under reduced motion
    const button = widget.getByRole('button');
    await button.focus();
    await button.press('ArrowDown');
    await expect.poll(async () => `${await vecA.getAttribute('x2')},${await vecA.getAttribute('y2')}`).not.toBe(vecBefore);

    await button.press('Space');
    await expect(widget.getByRole('status')).toContainText('1 pair measured, opposite every time.');
  });

  test('does not appear on /projects (home page only)', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('entangled-bloch-spheres')).toHaveCount(0);
  });

  test('adapts SVG stroke and surface tokens between light and dark themes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const wave = page.locator('path.entangled-wave');
    const sphere = page.locator('circle.entangled-sphere').first();

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    expect(await wave.evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(31, 58, 147)');
    expect(await sphere.evaluate((el) => getComputedStyle(el).fill)).toBe('rgb(255, 255, 255)');

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    expect(await wave.evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(157, 178, 255)');
    expect(await sphere.evaluate((el) => getComputedStyle(el).fill)).toBe('rgb(27, 27, 24)');
  });
});
