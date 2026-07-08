import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import HomePage from '../../../src/mobile/pages/client/home.page';
import MessengerPage from '../../../src/mobile/pages/client/messenger.page';
import SecurePage from '../../../src/mobile/pages/client/secure.page';
import ProfilePage from '../../../src/mobile/pages/client/profile.page';

describe('Smoke · Client navigation', () => {
  before(async () => {
    await AuthFlow.loginAs('client');
    await HomePage.open();
  });

  it('navigates HOME → MESSENGER', async () => {
    await MessengerPage.open();
    await expect(await MessengerPage.isActive()).toBe(true);
  });

  it('navigates to SECURE (Book Close Protection)', async () => {
    await SecurePage.open();
    await expect(await SecurePage.isActive()).toBe(true);
  });

  it('navigates to PROFILE', async () => {
    await ProfilePage.open();
    await expect(await ProfilePage.isActive()).toBe(true);
  });

  after(async () => {
    await HomePage.open().catch(() => undefined);
  });
});
