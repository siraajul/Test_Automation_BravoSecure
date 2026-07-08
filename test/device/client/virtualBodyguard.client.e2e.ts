import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import HomePage from '../../../src/mobile/pages/client/home.page';
import VirtualBodyguardPage from '../../../src/mobile/pages/client/virtualBodyguard.page';

describe('Client · Virtual Bodyguard (Virtual Dashboard)', () => {
  before(async () => {
    await AuthFlow.loginAs('client');
    await HomePage.open();
    await HomePage.openVirtualBodyguard();
  });

  it('opens the AI safety Virtual Dashboard', async () => {
    await expect(await VirtualBodyguardPage.isActive(20000)).toBe(true);
  });

  it('exposes safety quick-actions (Contact Ops, Request CPO)', async () => {
    await expect(await VirtualBodyguardPage.contactOpsButton.isExisting()).toBe(true);
    await expect(await VirtualBodyguardPage.requestCpoButton.isExisting()).toBe(true);
    // NOTE: the Panic Button is intentionally never tapped in tests.
  });
});
