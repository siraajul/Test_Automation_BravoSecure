import SecurePage from '../pages/client/secure.page';
import BookingPage from '../pages/client/booking.page';
import { DEFAULT_TIMEOUT } from '../pages/base.page';

/**
 * Client close-protection booking wizard. Drives steps 1→5 and stops at the
 * "Submit for Ops Review" terminal (never submits — that is a real dispatch).
 */
export const BookingFlow = {
  /** Secure tab → Book Now → step 1 (Select Location). */
  async start(): Promise<void> {
    await SecurePage.open();
    await SecurePage.bookNowButton.click();
    await BookingPage.waitUntilActive(DEFAULT_TIMEOUT);
  },

  /** Step 1 → 2: pick a live operating zone. */
  async selectZone(name = 'Dubai'): Promise<void> {
    await BookingPage.zone(name).click().catch(() => undefined); // may be pre-selected
    await BookingPage.continueButton.click();
  },

  /** Step 2 → 3: Secure Transfer is the only live service (pre-selected). */
  async selectSecureTransfer(): Promise<void> {
    await BookingPage.continueToScheduleButton.waitForDisplayed({ timeout: DEFAULT_TIMEOUT });
    await BookingPage.continueToScheduleButton.click();
  },

  /** Step 3 → 4: keep the "Book Now" default and confirm the schedule. */
  async confirmSchedule(): Promise<void> {
    await BookingPage.confirmScheduleButton.waitForDisplayed({ timeout: DEFAULT_TIMEOUT });
    await BookingPage.confirmScheduleButton.click();
  },

  /** Step 4 → 5: review the baseline package, go to add-ons. */
  async reviewPackage(): Promise<void> {
    await BookingPage.customiseAddonsButton.waitForDisplayed({ timeout: DEFAULT_TIMEOUT });
    await BookingPage.customiseAddonsButton.click();
  },

  /**
   * Walk the whole wizard to the final step. Returns when "Submit for Ops
   * Review" is on screen. Intentionally does NOT submit.
   */
  async walkToSubmit(zone = 'Dubai'): Promise<void> {
    await this.start();
    await this.selectZone(zone);
    await this.selectSecureTransfer();
    await this.confirmSchedule();
    await this.reviewPackage();
    await BookingPage.submitForOpsReviewButton.waitForDisplayed({ timeout: DEFAULT_TIMEOUT });
  },

  /**
   * ⛔ Submit the booking FOR REAL — creates a Pending Ops booking that Admin
   * approves and that dispatches to the CPO feed. Only the E2E flow calls this.
   */
  async submit(): Promise<void> {
    await BookingPage.submitForOpsReviewButton.click();
  },
};
