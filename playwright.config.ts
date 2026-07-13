import { defineConfig } from '@playwright/test';

const frontendPort = Number(process.env.PORT ?? 3005);
if (!Number.isInteger(frontendPort) || frontendPort < 1 || frontendPort > 65535) {
  throw new Error(`Invalid PORT for Playwright web server: ${process.env.PORT}`);
}

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${frontendPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
    command: `pnpm exec next dev --port ${frontendPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
