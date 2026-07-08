import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import { CommsFlow } from '../../../src/mobile/flows/comms.flow';
import ChatPage from '../../../src/mobile/pages/comms/chat.page';

/**
 * Single-device messaging smoke (client on the Pixel). Proves the chat compose
 * → send → bubble-rendered path end-to-end on one device, without needing the
 * second endpoint. The cross-device receive assertion lives in the multiremote
 * suite (wdio.multiremote.conf.ts).
 *
 *   ANDROID_DEVICE=<pixel> npx wdio run ./wdio.conf.ts \
 *     --spec ./test/mobile/comms/message.send.client.e2e.ts
 */
const PEER = process.env.COMMS_PEER ?? 'Sirajul Islam'; // 1:1 (· DEV) contact = client2

describe('Comms · 1:1 message send (single device)', () => {
  it('sends a message and sees it appear in the thread', async () => {
    const marker = `qa-auto ${Date.now()}`;

    await AuthFlow.loginAs('client');
    await CommsFlow.openMessenger();
    await CommsFlow.openConversation(PEER);

    await CommsFlow.sendMessage(marker);

    const appeared = await ChatPage.hasMessage(marker, 15000);
    await driver.saveScreenshot('./.explore/message_sent.png').catch(() => undefined);
    await expect(appeared).toBe(true);
  });
});
