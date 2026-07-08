import { test, expect } from '@playwright/test';
import { env } from '../../src/config/env';
import { AdminFlow } from '../../src/web/flows/admin.flow';

/**
 * Phase C — ops-console navigation breadth. After login, assert the console
 * exposes all the main section links. We assert the links are PRESENT rather
 * than clicking through (the live-data sections never settle → flaky/hanging).
 */
test.describe('Admin · console navigation', () => {
  test.skip(!env.admin.url, 'ADMIN_URL not set');

  test('the console exposes the main section links', async ({ page }) => {
    await AdminFlow.login(page);
    for (const section of ['Bookings', 'Agents', 'Finance', 'Live Ops'] as const) {
      await expect(page.getByRole('link', { name: section, exact: true }).first()).toBeVisible();
    }
  });
});
