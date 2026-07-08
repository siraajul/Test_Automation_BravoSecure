/**
 * 1:1 + group messaging across devices (multiremote). Run with:
 *   npx wdio run ./wdio.multiremote.conf.ts
 *
 * Under multiremote the configured instances are global: `client`, `cpo`,
 * `client2`. STUB — skipped until BlueStacks endpoints are set and chat
 * locators are confirmed.
 */
describe.skip('Comms · 1:1 message (multiremote)', () => {
  it('client sends a message, recipient receives it', async () => {
    // Example shape (to implement):
    // await AuthFlow on `client` and on the recipient instance, open the chat,
    // CommsFlow.sendMessage on sender, CommsFlow.expectMessageReceived on recipient.
  });
});

describe.skip('Comms · group message (member + admin)', () => {
  it('a member posts and other members receive', async () => {});
  it('an admin posts / manages the group', async () => {});
});
