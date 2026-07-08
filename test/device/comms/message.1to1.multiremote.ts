import { Comms } from '../../../src/mobile/flows/comms.mr';

/**
 * 1:1 message across two real endpoints (multiremote). We INITIATE from the AVD
 * (client2), which has the other parties saved as contacts and whose UI is fully
 * Appium-accessible (the Pixel's "Message by Number" dialog input is invisible to
 * UiAutomator2). The contact picker also yields a fresh pairwise E2E session.
 *
 *   client  = Pixel  (client1 · Shirajul)  +8801968602328   ← receiver
 *   client2 = AVD    (client2 · ITSirajul) +8801318402075   ← sender
 *
 *   ANDROID_DEVICE=<pixel> npx wdio run ./wdio.multiremote.conf.ts \
 *     --spec ./test/mobile/comms/message.1to1.multiremote.ts
 */
const C1_NUMBER = process.env.C1_NUMBER ?? '+8801968602328'; // Shirajul / Pixel

describe('Comms · 1:1 message (client2 → client1)', () => {
  it('client2 sends via contact and client1 receives it', async () => {
    const marker = `mr-1to1 ${Date.now()}`;

    // Sender (AVD) opens a chat with client1 from its contact picker.
    await Comms.startChatWithContact(client2, C1_NUMBER);
    await Comms.sendMessage(client2, marker);

    // Receiver (Pixel) opens the most-recent conversation and looks for it.
    await Comms.openTopConversation(client);
    const received = await Comms.expectMessage(client, marker, 30000);

    await client2.saveScreenshot('./.explore/mr_c2_sent.png').catch(() => undefined);
    await client.saveScreenshot('./.explore/mr_c1_recv.png').catch(() => undefined);
    await expect(received).toBe(true);
  });
});
