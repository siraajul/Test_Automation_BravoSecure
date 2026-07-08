import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import SecurePage from '../../../src/mobile/pages/client/secure.page';

describe('Client · Secure (Close Protection booking)', () => {
  before(async () => {
    await AuthFlow.loginAs('client');
    await SecurePage.open();
  });

  it('shows the Book Close Protection entry point and actions', async () => {
    await expect(await SecurePage.isActive()).toBe(true);
    await expect(await SecurePage.bookNowButton.isExisting()).toBe(true);
    await expect(await SecurePage.zoneMapButton.isExisting()).toBe(true);
    await expect(await SecurePage.myCreditsButton.isExisting()).toBe(true);
  });

  it('describes the 4-step booking flow (Select Service → Pay & Confirm)', async () => {
    await SecurePage.scrollToHowItWorks();
    await expect(await SecurePage.bookingStep('Select Service').isExisting()).toBe(true);
    await expect(await SecurePage.bookingStep('Set Location').isExisting()).toBe(true);
    await expect(await SecurePage.bookingStep('Pay & Confirm').isExisting()).toBe(true);
    // NOTE: we deliberately do NOT tap "Book Now" — it dispatches a real CPO.
  });
});
