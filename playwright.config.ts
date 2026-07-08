import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

// Web runner for the Admin dashboard. Install browsers once:
//   npx playwright install chromium
export default defineConfig({
  testDir: './test/web',
  timeout: 60_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: env.admin.url || undefined,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true, // sslip.io / self-signed friendly
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
