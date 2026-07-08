import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import MessengerPage, { type MessengerTab } from '../../../src/mobile/pages/client/messenger.page';

describe('Client · Messenger', () => {
  before(async () => {
    await AuthFlow.loginAs('client');
    await MessengerPage.open();
  });

  it('shows the Messenger screen with an AES-256 encryption badge', async () => {
    await expect(await MessengerPage.isActive()).toBe(true);
    await expect(await MessengerPage.encryptionBadge.isExisting()).toBe(true);
  });

  it('exposes all five sub-tabs (CHAT, GROUPS, CALL, FILES, NEWS)', async () => {
    const tabs: MessengerTab[] = ['CHAT', 'GROUPS', 'CALL', 'FILES', 'NEWS'];
    for (const tab of tabs) {
      await expect(await MessengerPage.subTab(tab).isExisting()).toBe(true);
    }
  });
});
