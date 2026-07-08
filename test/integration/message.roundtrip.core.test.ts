import { SessionManager, CiphertextType } from '@bravo/messenger-core';
import { makeParty } from './support/fixtures';
import { InMemoryRelay } from './support/relay';

/**
 * Headless two-client 1:1 delivery over messenger-core — the library-level
 * equivalent of driving two phones, minus the devices/UI. This is the layer
 * WhatsApp (libsignal) / Telegram (TDLib) rely on for delivery correctness and
 * the layer that actually catches the B-46/B-47 class. Runs in plain CI.
 *
 *   Alice = sender    Bob = receiver    Relay = transient store-and-forward
 */
describe('messenger-core · headless 1:1 delivery (send → relay → fetch → decrypt)', () => {
  it('establishes an X3DH session and delivers a single 1:1 message', async () => {
    const alice = await makeParty({ userId: 'alice', deviceId: 1 });
    const bob = await makeParty({ userId: 'bob', deviceId: 1 });
    const aliceMgr = new SessionManager(alice.store);
    const bobMgr = new SessionManager(bob.store);
    const relay = new InMemoryRelay();

    await aliceMgr.initOutgoingSession(bob.bundle);

    const ct = await aliceMgr.encrypt(bob.address, 'meet at 0900');
    relay.enqueue(bob.address, alice.address, ct);

    const [env] = relay.drain(bob.address);
    const body = await bobMgr.decrypt(env.from, env.ct);

    expect(env.ct.type).toBe(CiphertextType.PreKeyWhisper); // first msg bootstraps Bob
    expect(body).toBe('meet at 0900');
  });

  // Headless repro of the B-47 shape: A sends 1..5 while B is logged out /
  // offline; B fetches the whole backlog after coming online. All five must
  // arrive, in order — this is the assertion that fails on "A sends 1-5, B
  // renders 3-5".
  it('B-47 shape: 5 messages sent while recipient offline all arrive in order', async () => {
    const alice = await makeParty({ userId: 'alice', deviceId: 1 });
    const bob = await makeParty({ userId: 'bob', deviceId: 1 });
    const aliceMgr = new SessionManager(alice.store);
    const bobMgr = new SessionManager(bob.store);
    const relay = new InMemoryRelay();

    await aliceMgr.initOutgoingSession(bob.bundle);

    const sent = ['1', '2', '3', '4', '5'];
    for (const m of sent) {
      relay.enqueue(bob.address, alice.address, await aliceMgr.encrypt(bob.address, m));
    }
    expect(relay.pending(bob.address)).toBe(5); // whole backlog waiting

    const received: string[] = [];
    for (const env of relay.drain(bob.address)) {
      received.push(await bobMgr.decrypt(env.from, env.ct));
    }

    expect(received).toEqual(sent);
  });

  // The relay may deliver out of order; the Double Ratchet must cache skipped
  // message keys and still recover the middle message.
  it('recovers messages delivered out of order (skipped-key)', async () => {
    const alice = await makeParty({ userId: 'alice', deviceId: 1 });
    const bob = await makeParty({ userId: 'bob', deviceId: 1 });
    const aliceMgr = new SessionManager(alice.store);
    const bobMgr = new SessionManager(bob.store);

    await aliceMgr.initOutgoingSession(bob.bundle);

    const c1 = await aliceMgr.encrypt(bob.address, 'first');
    const c2 = await aliceMgr.encrypt(bob.address, 'second');
    const c3 = await aliceMgr.encrypt(bob.address, 'third');

    // Delivered 1, 3, 2.
    expect(await bobMgr.decrypt(alice.address, c1)).toBe('first');
    expect(await bobMgr.decrypt(alice.address, c3)).toBe('third');
    expect(await bobMgr.decrypt(alice.address, c2)).toBe('second');
  });
});
