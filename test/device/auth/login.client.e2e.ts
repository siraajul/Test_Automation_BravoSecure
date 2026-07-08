import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import LoginPage from '../../../src/mobile/pages/login.page';

describe('Auth · Client sign-in', () => {
  it('authenticates the client account and enters the app', async () => {
    // Handles biometric, an agent→client account switch, permissions, and
    // starting the encrypted-backup restore. Auth succeeded once the sign-in
    // form is gone (the app then proceeds to restore / home).
    await AuthFlow.loginAs('client');
    await expect(await LoginPage.isOnLoginForm()).toBe(false);
  });
});
