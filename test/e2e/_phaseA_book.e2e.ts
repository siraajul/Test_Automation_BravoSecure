import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import { BookingFlow } from '../../src/mobile/flows/booking.flow';
import BookingPage from '../../src/mobile/pages/client/booking.page';

// E2E Phase A — client (Pixel) creates a REAL booking. Captures the booking
// summary so the admin + CPO phases can identify it.
describe('E2E-A · client books on Pixel', () => {
  it('books and submits for Ops review', async () => {
    await AuthFlow.loginAs('client');
    await BookingFlow.walkToSubmit('Dubai');
    await BookingFlow.submit();
    await browser.pause(4000);
    const src = await driver.getPageSource();
    const fields = [...new Set(
      [...src.matchAll(/(?:text|content-desc)="([^"]{2,48})"/g)].map((m) => m[1]),
    )].filter((t) => /[A-Za-z0-9]/.test(t));
    console.log('BOOKING-SUMMARY =>', fields.slice(0, 24));
    await expect(await BookingPage.submitForOpsReviewButton.isExisting()).toBe(false);
  });
});
