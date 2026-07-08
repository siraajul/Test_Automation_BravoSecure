import type { Page } from '@playwright/test';

/**
 * Admin "Bravo Ops Console" dashboard (/dashboard). Verified live.
 * Nav: Dashboard · Bookings · Job Feed · Agents · Live Ops · Messenger ·
 *      Departments · Finance · Analytics · Settings.
 * Home shows: Pending Approval, Active Missions, Agents On Duty, Open Jobs, GMV,
 * an Approval Queue, Live Ops map, and an Activity stream
 * ("WOLF approved <id> · published to agent feed as JF-…").
 */
export class AdminDashboardPage {
  constructor(private readonly page: Page) {}

  async isLoaded(): Promise<boolean> {
    return this.page
      .getByRole('heading', { name: /Today at a Glance/i })
      .isVisible()
      .catch(() => false);
  }

  nav(name: 'Dashboard' | 'Bookings' | 'Job Feed' | 'Agents' | 'Live Ops' | 'Messenger' | 'Finance') {
    return this.page.getByRole('link', { name, exact: true });
  }

  async gotoBookings(): Promise<void> {
    await this.nav('Bookings').click();
  }

  /** The "Pending Approval" KPI on the home page. */
  pendingApprovalCount() {
    return this.page.getByText('Pending Approval').locator('..').getByText(/^\d+$/);
  }
}
