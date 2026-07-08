import { Comms } from '../../../src/mobile/flows/comms.mr';

/**
 * Group message across devices (multiremote). The three "SQA - *" groups exist
 * on every account with identical names, so they are the reliable cross-device
 * channel (1:1 DMs are titled inconsistently per side).
 *
 *   client  = Pixel  (client1 · Shirajul)   — member of SQA - ITSirajul
 *   client2 = AVD    (client2 · ITSirajul)  — admin  of SQA - ITSirajul
 *   client3 = AVD    (client3 · Fahim)      — member (only if CLIENT3_DEVICE set)
 *
 *   CLIENT3_DEVICE=emulator-5558 npx wdio run ./wdio.multiremote.conf.ts \
 *     --spec ./test/mobile/comms/message.group.multiremote.ts
 */
const GROUP = process.env.GROUP_NAME ?? 'SQA - ITSirajul';
const hasClient3 = typeof client3 !== 'undefined';

describe(`Comms · group message · ${GROUP}`, () => {
  it('a member posts and the other devices receive it', async () => {
    const marker = `grp ${Date.now()}`;

    await Comms.gotoChatList(client);
    await Comms.gotoChatList(client2);
    if (hasClient3) await Comms.gotoChatList(client3);

    await Comms.openConversation(client, GROUP);
    await Comms.openConversation(client2, GROUP);
    if (hasClient3) await Comms.openConversation(client3, GROUP);

    // client1 (a member) posts.
    await Comms.sendMessage(client, marker);

    const onC2 = await Comms.expectMessage(client2, marker, 30000);
    const onC3 = hasClient3 ? await Comms.expectMessage(client3, marker, 30000) : true;

    await client2.saveScreenshot('./.explore/grp_c2.png').catch(() => undefined);
    if (hasClient3) await client3.saveScreenshot('./.explore/grp_c3.png').catch(() => undefined);

    await expect(onC2).toBe(true);
    await expect(onC3).toBe(true);
  });
});
