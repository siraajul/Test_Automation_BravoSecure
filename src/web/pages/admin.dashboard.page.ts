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
    // Authed once the console nav renders. WAIT for a stable nav link (an instant
    // isVisible() races the render) rather than a home-page heading that drifts.
    return this.page
      .getByRole('link', { name: 'Bookings', exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 8000 })
      .then(() => true)
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
