import { BasePage } from '../base.page';
import { byTextOrDesc } from '../../../helpers/selectors';
import { ClientNav } from './navigation';

/**
 * Bravo Secure — physical close-protection booking.
 * Booking flow: Select Service -> Set Location -> Add-Ons -> Pay & Confirm.
 * NOTE: do not tap "Book Now" through to confirmation in tests — it dispatches
 * a real CPO booking.
 */
class SecurePage extends BasePage {
  protected get rootLocator(): string {
    // The "Book Close Protection" hero is an image; the stable header is the
    // "BRAVO SECURE" title with the "Book Now" CTA below it.
    return byTextOrDesc('BRAVO SECURE');
  }

  get bookNowButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Book Now'));
  }
  get zoneMapButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Zone Map'));
  }
  get myCreditsButton(): ChainablePromiseElement {
    return $(byTextOrDesc('My Credits'));
  }

  /** Booking flow steps shown under "How it works". */
  bookingStep(label: 'Select Service' | 'Set Location' | 'Add-Ons' | 'Pay & Confirm'): ChainablePromiseElement {
    return $(byTextOrDesc(label));
  }

  /** Scroll the "How it works" steps into view (below the fold). */
  async scrollToHowItWorks(): Promise<void> {
    try {
      await $(
        'android=new UiScrollable(new UiSelector().scrollable(true))' +
          '.scrollIntoView(new UiSelector().textContains("Pay & Confirm"))',
      );
    } catch {
      // single-screen layout
    }
  }

  async open(): Promise<void> {
    await ClientNav.go('SECURE');
    await this.waitUntilActive();
  }
}

export default new SecurePage();
