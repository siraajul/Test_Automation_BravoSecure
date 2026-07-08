import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env';
import { AdminFlow } from '../../src/web/flows/admin.flow';

// Verified live via Playwright MCP. To run locally: `npm run install:browsers`
// then `npm run test:admin`. Skips if ADMIN_URL is not configured.
test.describe('Admin · Ops Console', () => {
  test.skip(!env.admin.url, 'ADMIN_URL not set');

  test('logs in (phone + password + OTP) and reaches the dashboard', async ({ page }) => {
    const dashboard = await AdminFlow.login(page);
    expect(await dashboard.isLoaded()).toBeTruthy();
  });

  test('opens the Bookings queue', async ({ page }) => {
    const dashboard = await AdminFlow.login(page);
    await dashboard.gotoBookings();
    await expect(page).toHaveURL(/\/bookings/); // navigation landed (stable vs a live-loading heading)
  });
});
