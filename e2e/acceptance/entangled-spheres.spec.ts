import { test, expect, type Locator } from '@playwright/test';

const vectorOffsets = (widget: Locator) => widget.locator('line.entangled-vec').evaluateAll((els) =>
  els.map((el) => ({
    x: Number(el.getAttribute('x2')) - Number(el.getAttribute('x1')),
    y: Number(el.getAttribute('y2')) - Number(el.getAttribute('y1')),
  })),
);

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
    await page.emulateMedia({ reducedMotion: 'reduce' });
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

      const readout = widget.locator('.entangled-foot p').first();
      for (let step = 0; step < 24; step += 1) {
        const before = await readout.innerText();
        await button.press('ArrowRight');
        await expect(readout).not.toHaveText(before, { useInnerText: true });
        const textFits = await readout.evaluate((el) => {
          const bounds = el.getBoundingClientRect();
          return Array.from(el.children).every((child) => {
            const range = document.createRange();
            range.selectNodeContents(child);
            return Array.from(range.getClientRects()).every((rect) =>
              rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1,
            ) && child.scrollWidth <= child.clientWidth + 1;
          });
        });
        expect(textFits).toBe(true);
      }

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

  test('updates both phase readouts without changing the Born probability', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const widget = page.getByTestId('entangled-bloch-spheres');
    await widget.scrollIntoViewIfNeeded();
    const fields = widget.locator('.entangled-foot p').first().locator('span');
    const before = await fields.allTextContents();
    await widget.getByRole('button').press('ArrowRight');
    await expect(fields.nth(0)).not.toHaveText(before[0]);
    await expect(fields.nth(1)).not.toHaveText(before[1]);
    await expect(fields.nth(2)).toHaveText(before[2]);
  });

  test('does not steer across the empty bridge outside both influence regions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const widget = page.getByTestId('entangled-bloch-spheres');
    await widget.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const box = await widget.getByRole('button').boundingBox();
    expect(box!.width).toBeGreaterThan(464);
    const readout = widget.locator('.entangled-foot p').first();

    for (const x of [80, box!.width - 80]) {
      const previous = await vectorOffsets(widget);
      await page.mouse.move(box!.x + x, box!.y + 54);
      await expect.poll(() => vectorOffsets(widget)).not.toEqual(previous);
      const steered = await vectorOffsets(widget);
      const text = await readout.innerText();
      for (const y of [1, 54, 119]) {
        await page.mouse.move(box!.x + box!.width / 2, box!.y + y);
        await page.waitForTimeout(50);
        expect(await vectorOffsets(widget)).toEqual(steered);
        await expect(readout).toHaveText(text, { useInnerText: true });
      }
    }
  });

  for (const pole of [0, 1] as const) {
    for (const source of ['measurement', 'pointer', 'keyboard'] as const) {
      test(`resumes antipodal idle drift from pole ${pole} after ${source}`, async ({ page }) => {
        await page.clock.install({ time: new Date('2026-11-20T00:00:00Z') });
        await page.setViewportSize({ width: 800, height: 900 });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const widget = page.getByTestId('entangled-bloch-spheres');
        await widget.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.clock.pauseAt(new Date('2026-11-20T00:01:00Z'));
        const button = widget.getByRole('button');
        await button.focus();

        if (source === 'measurement') {
          await page.evaluate((randomValue) => { Math.random = () => randomValue; }, pole === 0 ? 0 : 0.999999);
          await button.press('Space');
        } else if (source === 'pointer') {
          const box = await button.boundingBox();
          await page.mouse.move(box!.x + (pole === 0 ? 52 : box!.width - 52), box!.y + 54);
        } else {
          for (let step = 0; step < 15; step += 1) {
            await button.press(pole === 0 ? 'ArrowUp' : 'ArrowDown');
          }
        }

        await page.clock.runFor(1000);
        const collapsed = await vectorOffsets(widget);
        expect(collapsed[0].x).toBeCloseTo(0, 1);
        expect(collapsed[0].y).toBeCloseTo(pole === 0 ? -40 : 40, 1);
        if (source === 'measurement') {
          await expect(widget.getByText('measured', { exact: true })).toBeVisible();
          await expect(widget.getByRole('status')).toContainText(`A |${pole}⟩, B |${1 - pole}⟩`);
        }

        await page.mouse.move(0, 0);
        await button.evaluate((el) => el.blur());
        await page.clock.runFor(1000);
        const recovered = await vectorOffsets(widget);
        expect(Math.abs(recovered[0].y)).toBeLessThan(38);
        expect(recovered[0].x + recovered[1].x).toBeCloseTo(0, 1);
        expect(recovered[0].y + recovered[1].y).toBeCloseTo(0, 1);
        await expect(widget.getByText('measured', { exact: true })).toBeHidden();
        await page.clock.runFor(500);
        expect(await vectorOffsets(widget)).not.toEqual(recovered);
      });
    }
  }

  test('holds a still frame under prefers-reduced-motion while remaining interactive', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-20T00:00:00Z') });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const widget = page.getByTestId('entangled-bloch-spheres');
    await widget.scrollIntoViewIfNeeded();
    await page.clock.pauseAt(new Date('2026-11-20T00:01:00Z'));
    const wave = widget.locator('path.entangled-wave');
    const vecA = widget.locator('line.entangled-vec').first();

    const waveBefore = await wave.getAttribute('d');
    const vecBefore = `${await vecA.getAttribute('x2')},${await vecA.getAttribute('y2')}`;
    await page.clock.runFor(450);
    const waveAfter = await wave.getAttribute('d');
    const vecAfter = `${await vecA.getAttribute('x2')},${await vecA.getAttribute('y2')}`;

    expect(waveAfter).toBe(waveBefore);
    expect(vecAfter).toBe(vecBefore);

    // Steering and measurement still work under reduced motion
    const button = widget.getByRole('button');
    await button.focus();
    await button.press('ArrowDown');
    await page.clock.runFor(20);
    expect(`${await vecA.getAttribute('x2')},${await vecA.getAttribute('y2')}`).not.toBe(vecBefore);

    await button.press('Space');
    await expect(widget.getByRole('status')).toContainText('1 pair measured, opposite every time.');
    const collapsed = await vectorOffsets(widget);
    const measuredWave = await wave.getAttribute('d');
    await button.evaluate((el) => el.blur());
    await page.clock.runFor(1800);
    expect(await vectorOffsets(widget)).toEqual(collapsed);
    expect(await wave.getAttribute('d')).toBe(measuredWave);
    await expect(widget.getByText('measured', { exact: true })).toBeHidden();

    const box = await button.boundingBox();
    await page.mouse.move(box!.x + 80, box!.y + 54);
    await page.clock.runFor(20);
    expect(await vectorOffsets(widget)).not.toEqual(collapsed);
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
