import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import { env } from '../../../src/config/env';
import LoginPage from '../../../src/mobile/pages/login.page';

/** Negative auth — drives from a guaranteed logged-out sign-in form. */
describe('Auth · Negative sign-in', () => {
  before(async () => {
    await AuthFlow.ensureLoggedOut();
    await AuthFlow.reachSignInForm();
  });

  it('stays on the sign-in form when the password is wrong', async () => {
    await LoginPage.signIn(env.client.email, 'WrongPassword123!');
    await browser.pause(4000);
    await expect(await LoginPage.isOnLoginForm()).toBe(true);
  });
});
