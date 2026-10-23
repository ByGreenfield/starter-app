import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke suite. BASE_URL points it at any deployment (a Render preview, production after a
 * release); without it, the suite starts the production build locally, which needs DATABASE_URL.
 */
const baseURL = process.env.BASE_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: 'tests/smoke',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }],
  ...(process.env.BASE_URL
    ? {}
    : {
        webServer: {
          command: 'pnpm start -p 3100',
          url: 'http://localhost:3100/api/health',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
