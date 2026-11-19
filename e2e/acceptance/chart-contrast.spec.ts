import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { test, expect, type Locator } from '@playwright/test';
import polyline from '@mapbox/polyline';

async function paintedContrast(elements: Locator, property: 'fill' | 'stroke' | 'backgroundColor' | 'color' | 'borderTopColor') {
  return elements.evaluateAll((nodes, property) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const channels = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    const luminance = (color: number[]) => color.slice(0, 3).reduce((sum, value, index) => {
      const channel = value / 255;
      const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
    }, 0);
    return nodes.map((node) => {
      const style = getComputedStyle(node);
      const foreground = channels(style[property]);
      let ancestor = node.parentElement;
      while (ancestor && channels(getComputedStyle(ancestor).backgroundColor)[3] === 0) {
        ancestor = ancestor.parentElement;
      }
      const background = channels(getComputedStyle(ancestor || document.body).backgroundColor);
      const opacity = Number(style.opacity) * (property === 'fill' ? Number(style.fillOpacity) : 1) * foreground[3]! / 255;
      const composite = foreground.slice(0, 3).map((value, index) => value * opacity + background[index]! * (1 - opacity));
      const a = luminance(composite);
      const b = luminance(background);
      return { color: foreground.slice(0, 3), luminance: a, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
    });
  }, property);
}

async function expectGraphicalContrast(elements: Locator, property: Parameters<typeof paintedContrast>[1]) {
  await expect.poll(async () => {
    const marks = await paintedContrast(elements, property);
    return marks.length > 0 && marks.every(({ ratio }) => ratio >= 3);
  }).toBe(true);
  return paintedContrast(elements, property);
}

test.describe('Rendered chart palette', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ reducedMotion: 'reduce' });
  let fixtureServer: ChildProcess;

  test.beforeAll(async ({ request }) => {
    fixtureServer = spawn(resolve('node_modules/.bin/vite'), [resolve('e2e/fixtures/charts'), '--host', '127.0.0.1', '--port', '3017', '--strictPort'], { stdio: 'inherit' });
    await expect.poll(async () => {
      try {
        return (await request.get('http://127.0.0.1:3017')).status();
      } catch {
        return 0;
      }
    }).toBe(200);
  });

  test.afterAll(() => { fixtureServer?.kill('SIGTERM'); });

  for (const theme of ['light', 'dark']) {
    test(`${theme} chart marks contrast with their actual rendered surfaces`, async ({ page }) => {
      await page.goto('http://127.0.0.1:3017');
      await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), theme);
      const heatmap = page.getByRole('region', { name: 'Heatmap', exact: true });
      await expect(heatmap.getByTitle('2026-01-22: strain 21', { exact: true })).toBeVisible();
      let previous: number | undefined;
      for (const strain of [1, 3, 6, 8, 10, 12, 14, 16, 18, 20]) {
        const date = `2026-01-${String(strain + 1).padStart(2, '0')}`;
        const cell = heatmap.getByTitle(`${date}: strain ${strain}`, { exact: true });
        const marks = await expectGraphicalContrast(cell, 'backgroundColor');
        if (previous !== undefined) {
          if (theme === 'light') expect(marks[0]!.luminance).toBeLessThan(previous);
          else expect(marks[0]!.luminance).toBeGreaterThan(previous);
        }
        previous = marks[0]!.luminance;
        const legend = heatmap.locator('[title]').filter({ hasText: new RegExp(`^${strain}(?:-|:)`) }).last();
        expect((await paintedContrast(legend, 'backgroundColor'))[0]!.color).toEqual(marks[0]!.color);
      }
      await expectGraphicalContrast(heatmap.getByTitle('2026-01-01: strain 0', { exact: true }), 'borderTopColor');

      for (const label of ['Training', 'Distribution']) {
        const chart = page.getByRole('region', { name: label, exact: true });
        await expect(chart.getByText('TOTAL', { exact: true })).toBeVisible();
        const bars = await expectGraphicalContrast(chart.locator('rect.bar-anim'), 'fill');
        expect(new Set(bars.map(({ color }) => color.join(','))).size).toBe(3);
        for (const sport of ['Weightlifting', 'Running', 'Boxing']) {
          const key = chart.getByText(sport, { exact: true }).first().locator('..').locator('div').first();
          const mark = (await expectGraphicalContrast(key, 'backgroundColor'))[0]!;
          expect(bars.some(({ color }) => color.join(',') === mark.color.join(','))).toBe(true);
        }
        const donut = await chart.locator('div[style*="conic-gradient"]').screenshot({ animations: 'disabled' });
        const pixels = await page.evaluate(async (encoded) => {
          const image = new Image();
          image.src = `data:image/png;base64,${encoded}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          return [60, 180, 300].map((degrees) => {
            const angle = degrees * Math.PI / 180;
            const x = image.width / 2 + Math.sin(angle) * image.width * 0.45;
            const y = image.height / 2 - Math.cos(angle) * image.height * 0.45;
            return Array.from(context.getImageData(Math.floor(x), Math.floor(y), 1, 1).data).slice(0, 3);
          });
        }, donut.toString('base64'));
        expect(pixels).toEqual(bars.map(({ color }) => color));
        if (label === 'Training') {
          const monthly = chart.getByRole('heading', { name: 'Monthly Training Days', exact: true }).locator('..');
          await expectGraphicalContrast(monthly.locator('svg rect'), 'fill');
        }
      }

      await expectGraphicalContrast(page.getByRole('region', { name: 'Correlation', exact: true }).locator('svg circle'), 'fill');
      await expectGraphicalContrast(page.getByRole('region', { name: 'Habits', exact: true }).locator('.recharts-bar-rectangle path'), 'fill');
      await expectGraphicalContrast(page.getByRole('region', { name: 'Recovery', exact: true }).locator('.recharts-bar-rectangle path'), 'fill');
      await expectGraphicalContrast(page.getByRole('region', { name: 'Workout times', exact: true }).locator('svg circle[fill], svg path[fill]'), 'fill');
      await page.screenshot({ path: `test-results/chart-palette-${theme}.png`, fullPage: true });
    });

    test(`${theme} trainer charts retain visible categories`, async ({ page }) => {
      await page.route('**/api/ai/trainer/history*', (route) => route.fulfill({
        headers: { 'access-control-allow-origin': '*' },
        json: {
          status: 'success',
          data: { evaluations: [1, 2].map((id) => ({
            id, created_at: `2026-01-0${id}T12:00:00Z`, updated_at: `2026-01-0${id}T12:00:00Z`,
            confidence_score: 80 + id,
            evaluation_data: { total_questions: 10, successful_queries: 8, failed_queries: 2, avg_response_time: 150 },
          })) },
        },
      }));
      await page.goto('/ai-trainer');
      await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), theme);
      const status = page.getByText('Cycle Status Distribution', { exact: true }).locator('..');
      await expect(status.locator('.recharts-sector').first()).toBeVisible();
      await expectGraphicalContrast(status.locator('.recharts-sector'), 'fill');
      await page.getByRole('button', { name: 'insights', exact: true }).click();
      const comparison = page.getByText('Response Time vs Success Rate', { exact: true }).locator('..');
      await expect(comparison.locator('.recharts-bar-rectangle path').first()).toBeVisible();
      await expectGraphicalContrast(comparison.locator('.recharts-bar-rectangle path'), 'fill');
    });

    test(`${theme} map coverage and tooltip retain contrast through run selection`, async ({ page }) => {
      const streets = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[-73.918, 40.769], [-73.910, 40.774]] } }],
      };
      await page.route('**/api/astoria/**', (route) => route.fulfill({ json: route.request().url().endsWith('/stats') ? {
        summary: { covered_miles: 1, total_miles: 10, covered_segments: 1, total_segments: 10, percent_complete: 10, last_updated: '2026-01-15', total_runs: 2 },
        runs: [1, 2].map((id) => ({ id, run_number: id, name: `Test run ${id}`, date: `2026-01-0${id}T12:00:00Z`, distance_meters: 5000, duration_seconds: 1800 + id * 60, heart_rate_zones: { rest: 300, light: 300, moderate: 300, hard: 300, peak: 300, max: 300 }, polyline: polyline.encode([[40.769, -73.918], [40.774, -73.910]]) })),
      } : streets }));
      await page.goto('/apps/astoria-conquest');
      await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), theme);
      const covered = page.locator('.leaflet-overlay-pane path[stroke-width="3"]');
      await expect(covered).toBeVisible();
      const colors = [await covered.evaluate((node) => getComputedStyle(node).stroke)];
      const card = page.getByRole('heading', { name: /^Run #\d+$/ }).first().locator('../../..');
      const zones = page.getByRole('heading', { name: 'Heart Rate Zones Distribution', exact: true }).locator('../..');
      const checkZonePalette = async () => {
        const palettes: string[][] = [];
        for (const consumer of [card, zones]) {
          const swatches = consumer.locator('span[aria-hidden]');
          await expect(swatches).toHaveCount(6);
          const keys = await expectGraphicalContrast(swatches, 'backgroundColor');
          const palette = keys.map(({ color }) => color.join(','));
          expect(new Set(palette).size).toBe(6);
          palettes.push(palette);
          const bars = await expectGraphicalContrast(consumer.locator('[title^="Zone "]'), 'backgroundColor');
          for (const { color } of bars) expect(palette).toContain(color.join(','));
        }
        expect(palettes[0]).toEqual(palettes[1]);
      };
      await checkZonePalette();
      await page.getByRole('button', { name: 'Run #1', exact: true }).click();
      await checkZonePalette();
      const selected = page.locator('.leaflet-overlay-pane path[stroke-width="4"]');
      await expect(selected).toBeAttached();
      colors.push(await selected.evaluate((node) => getComputedStyle(node).stroke));
      for (const color of colors) {
        const ratio = await page.evaluate((color) => {
          const luminance = (rgb: number[]) => rgb.reduce((sum, value, index) => {
            const channel = value / 255;
            return sum + (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index]!;
          }, 0);
          const foreground = luminance(color.match(/[\d.]+/g)!.slice(0, 3).map(Number));
          return (foreground + 0.05) / (luminance([68, 68, 68]) + 0.05);
        }, color);
        expect(ratio).toBeGreaterThanOrEqual(3);
      }
      const pace = page.getByText('Pace History', { exact: true }).locator('..');
      const dot = pace.locator('.recharts-line-dot').first();
      await pace.locator('.recharts-wrapper').hover();
      await expect.poll(() => pace.evaluate((node) => {
        let opacity = 1;
        for (let ancestor: Element | null = node; ancestor; ancestor = ancestor.parentElement) {
          opacity *= Number(getComputedStyle(ancestor).opacity);
        }
        return opacity;
      })).toBe(1);
      await expect(pace.locator('.recharts-tooltip-item')).toBeVisible();
      const text = await paintedContrast(pace.locator('.recharts-tooltip-item'), 'color');
      expect(text[0]!.ratio).toBeGreaterThanOrEqual(4.5);
      await expectGraphicalContrast(dot, 'fill');
      await page.screenshot({ path: `test-results/map-palette-${theme}.png` });
      await page.setViewportSize({ width: 390, height: 844 });
      await checkZonePalette();
      await card.screenshot({ path: `test-results/zone-palette-${theme}-mobile.png`, animations: 'disabled' });
    });
  }
});
