import { BasePage } from '../base.page';
import { byTextOrDesc } from '../../../helpers/selectors';

/**
 * Client "Book Close Protection" wizard (5 steps). Verified live on the Pixel 7a.
 *
 *  1. Select Location   — choose operating zone (AE/BD live) → Continue
 *  2. Select Service    — Secure Transfer Booking → Continue to Schedule
 *  3. Schedule          — Book Now/Later, pickup/drop-off, time → Confirm Schedule
 *  4. Baseline Package  — review inclusions → Customise Add-ons
 *  5. Team & Add-ons    — counts + optional add-ons → Submit for Ops Review  ⛔
 *
 * ⛔ NEVER tap "Submit for Ops Review" in tests — it dispatches a real booking
 *    that Ops/CPO receive. Walk up to it and assert only.
 */
class BookingPage extends BasePage {
  protected get rootLocator(): string {
    return byTextOrDesc('CHOOSE OPERATING ZONE'); // step 1 header
  }

  // ── Step 1: Select Location ──
  zone(name: string): ChainablePromiseElement {
    return $(byTextOrDesc(name)); // e.g. 'Dubai' (AE) or 'Dhaka' (BD)
  }
  get continueButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Continue'));
  }

  // ── Step 2: Select Service ──
  get secureTransferService(): ChainablePromiseElement {
    return $(byTextOrDesc('Secure Transfer Booking'));
  }
  get continueToScheduleButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Continue to Schedule'));
  }

  // ── Step 3: Schedule ──
  get bookNowOption(): ChainablePromiseElement {
    return $(byTextOrDesc('Book Now'));
  }
  get confirmScheduleButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Confirm Schedule'));
  }

  // ── Step 4: Baseline Package ──
  get baselinePackageHeader(): ChainablePromiseElement {
    return $(byTextOrDesc('Baseline Package'));
  }
  get customiseAddonsButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Customise Add-ons'));
  }

  // ── Step 5: Team & Add-ons (terminal) ──
  get teamAddonsHeader(): ChainablePromiseElement {
    return $(byTextOrDesc('Team & Add-ons'));
  }
  /** ⛔ Do NOT click — submitting creates a real Ops booking/dispatch. */
  get submitForOpsReviewButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Submit for Ops Review'));
  }
}

export default new BookingPage();
