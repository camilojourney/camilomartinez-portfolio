import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'off',
  },
  // No webServer -- reuse the already-running dev server on :3005
});
