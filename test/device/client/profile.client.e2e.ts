import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import ProfilePage from '../../../src/mobile/pages/client/profile.page';

describe('Client · Profile', () => {
  before(async () => {
    await AuthFlow.loginAs('client');
    await ProfilePage.open();
  });

  it('shows the account header (Edit Profile)', async () => {
    await expect(await ProfilePage.isActive()).toBe(true);
  });

  it('exposes Security controls (Biometric Lock, Two-Factor Auth)', async () => {
    await expect(await ProfilePage.biometricLockToggle.isExisting()).toBe(true);
    await expect(await ProfilePage.twoFactorAuth.isExisting()).toBe(true);
  });

  it('links to the Agent Portal', async () => {
    await expect(await ProfilePage.agentPortal.isExisting()).toBe(true);
  });
});
