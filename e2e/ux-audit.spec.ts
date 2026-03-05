/**
 * UX Crew — Screenshot Capture Script
 *
 * Reads routes from ux-crew.yaml and captures full-page screenshots
 * for desktop and mobile viewports. Used by the UX crew agents for review.
 *
 * Run: pnpm exec playwright test e2e/ux-audit.spec.ts
 */
import { test } from '@playwright/test';
import { parse } from 'yaml';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';

const manifest = parse(
  readFileSync(path.join(__dirname, 'ux-crew.yaml'), 'utf-8')
);

const today = new Date().toISOString().split('T')[0];
const baseDir = path.join(__dirname, 'screenshots', 'audit', today);

const viewports = manifest.screenshots.viewports;

// --- Public routes (no auth needed) ---
for (const route of manifest.routes.public ?? []) {
  for (const [vpName, vp] of Object.entries(viewports)) {
    test(`${vpName} — ${route.name}`, async ({ page }) => {
      const dir = path.join(baseDir, vpName);
      mkdirSync(dir, { recursive: true });

      await page.setViewportSize(vp as { width: number; height: number });
      await page.goto(route.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500); // let animations settle

      await page.screenshot({
        path: path.join(dir, `${route.name}.png`),
        fullPage: true,
      });
    });
  }
}
