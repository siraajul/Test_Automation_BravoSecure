import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import { BookingFlow } from '../../../src/mobile/flows/booking.flow';
import BookingPage from '../../../src/mobile/pages/client/booking.page';

/**
 * Client close-protection booking wizard, all 5 steps. Stops at the terminal
 * "Submit for Ops Review" and asserts it — never submits (real dispatch).
 */
describe('Client · Booking (Close Protection)', () => {
  before(async () => {
    await AuthFlow.loginAs('client');
  });

  it('starts the wizard at Select Location (Choose Operating Zone)', async () => {
    await BookingFlow.start();
    await expect(await BookingPage.isActive()).toBe(true);
  });

  it('walks Service → Schedule → Package → Add-ons and reaches Submit', async () => {
    await BookingFlow.selectZone('Dubai');
    await BookingFlow.selectSecureTransfer();
    await BookingFlow.confirmSchedule();
    await BookingFlow.reviewPackage();
    // Final step present, but DO NOT submit (real Ops dispatch).
    await expect(await BookingPage.teamAddonsHeader.isExisting()).toBe(true);
    await expect(await BookingPage.submitForOpsReviewButton.isExisting()).toBe(true);
  });
});
