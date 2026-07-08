import type { Page } from '@playwright/test';

export type BookingStatus =
  | 'ALL'
  | 'Pending Ops'
  | 'Ops Approved'
  | 'Payment Pending'
  | 'Confirmed'
  | 'Live'
  | 'Completed'
  | 'Cancelled';

/**
 * Admin Bookings Queue (/bookings). Verified live.
 * Status pipeline: Pending Ops → Ops Approved → Payment Pending → Confirmed →
 * Live → Completed. A client's submitted booking lands here as "Pending Ops";
 * the admin approves it, which publishes it to the CPO job feed (JF-…).
 *
 * The per-row Approve control can only be mapped against a real pending booking
 * (none in the queue when empty) — see approveFirstPending(): the row-open and
 * approve-button selectors are marked TODO until the E2E creates one.
 */
export class AdminBookingsPage {
  constructor(private readonly page: Page) {}

  async goto(baseUrl: string): Promise<void> {
    await this.page.goto(new URL('/bookings', baseUrl).toString());
  }

  filter(status: BookingStatus) {
    return this.page.getByText(status, { exact: true });
  }

  async filterBy(status: BookingStatus): Promise<void> {
    await this.filter(status).click();
  }

  rows() {
    return this.page.locator('table tbody tr');
  }

  async pendingCount(): Promise<number> {
    await this.filterBy('Pending Ops');
    return this.rows().count();
  }

  /** Open the first booking detail from anywhere a /bookings/<id> link exists. */
  async openFirstBookingDetail(): Promise<void> {
    await this.page.locator('a[href^="/bookings/"]').first().click();
    await this.page.getByRole('heading', { name: /Booking .* (PENDING OPS|OPS APPROVED)/ }).waitFor();
  }

  /**
   * Approve + publish the open booking to the agent feed. Verified live:
   * APPROVE & PUBLISH → pick a dress-brief preset → CONFIRM & PUBLISH →
   * status flips to OPS APPROVED.
   */
  async approveAndPublish(dressPreset = /Black suit/): Promise<void> {
    await this.page.getByRole('button', { name: /APPROVE & PUBLISH/ }).click();
    await this.page.getByRole('button', { name: dressPreset }).click();
    await this.page.getByRole('button', { name: 'CONFIRM & PUBLISH' }).click();
    await this.page.getByText('OPS APPROVED').waitFor();
  }

  /** Full path: open the first pending booking and approve+publish it. */
  async approveFirstPending(): Promise<void> {
    await this.openFirstBookingDetail();
    await this.approveAndPublish();
  }
}
