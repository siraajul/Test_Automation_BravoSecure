import {
  SessionManager,
  unsealPayload,
  broadcastToGroup,
  parseGroupMessage,
  makeNewGroup,
  genFreshGroupMasterKey,
  groupEncrypt,
  groupDecrypt,
  type Ciphertext,
  type SessionAddress,
} from '@bravo/messenger-core';
import { makeParty } from './support/fixtures';

/**
 * Headless group delivery over messenger-core — three clients, one process.
 * Guards B-35: "a group member's outbound is undecryptable by ALL other
 * members (sender-side group-key distribution gap)". The full send path is a
 * pairwise sealed-sender fan-out; each recipient decrypts its own copy, unseals,
 * then unlocks the group body with the shared master key.
 *
 *   alice = owner / admin      bob = member      carol = member
 */
const A: SessionAddress = { userId: 'alice', deviceId: 1 }; // owner / admin
const B: SessionAddress = { userId: 'bob', deviceId: 1 };   // member
const C: SessionAddress = { userId: 'carol', deviceId: 1 }; // member

async function setupTrio() {
  const alice = await makeParty(A);
  const bob = await makeParty(B);
  const carol = await makeParty(C);
  const mgr = {
    alice: new SessionManager(alice.store),
    bob: new SessionManager(bob.store),
    carol: new SessionManager(carol.store),
  };
  const group = makeNewGroup({
    name: 'Protection Detail',
    owner: 'alice',
    ownerDeviceId: 1,
    members: [B, C],
  });
  return { alice, bob, carol, mgr, group };
}

interface Copy {
  peer: SessionAddress;
  ct: Ciphertext;
}

// Fan a sender's group message out to the other members; return each copy.
async function broadcast(
  group: ReturnType<typeof makeNewGroup>,
  senderMgr: SessionManager,
  self: SessionAddress,
  body: string,
): Promise<Copy[]> {
  const copies: Copy[] = [];
  const res = await broadcastToGroup({
    group,
    self,
    cert: 'test-sender-cert', // opaque; sealPayload only checks non-empty
    body,
    session: senderMgr,
    deliver: async (peer, ct) => {
      copies.push({ peer, ct });
    },
  });
  expect(res.recipients).toBe(copies.length);
  return copies;
}

// A recipient decrypts its pairwise copy, unseals, and unlocks the group body.
async function receive(
  recipientMgr: SessionManager,
  senderAddr: SessionAddress,
  copy: Copy,
  masterKeyB64: string,
) {
  const plain = await recipientMgr.decrypt(senderAddr, copy.ct);
  return parseGroupMessage(unsealPayload(plain), masterKeyB64);
}

const pick = (copies: Copy[], userId: string): Copy =>
  copies.find((c) => c.peer.userId === userId)!;

describe('messenger-core · headless group delivery (B-35 guard)', () => {
  it("a member's outbound is decryptable by ALL other members", async () => {
    const { alice, carol, mgr, group } = await setupTrio();

    // Bob (a non-owner member) sends → open sessions to the other members.
    await mgr.bob.initOutgoingSession(alice.bundle);
    await mgr.bob.initOutgoingSession(carol.bundle);

    const copies = await broadcast(group, mgr.bob, B, 'sitrep: perimeter clear');
    expect(copies.map((c) => c.peer.userId).sort()).toEqual(['alice', 'carol']);

    const onAlice = await receive(mgr.alice, B, pick(copies, 'alice'), group.masterKeyB64);
    const onCarol = await receive(mgr.carol, B, pick(copies, 'carol'), group.masterKeyB64);

    expect(onAlice.ok).toBe(true);
    expect(onCarol.ok).toBe(true);
    if (onAlice.ok) expect(onAlice.envelope.body).toBe('sitrep: perimeter clear');
    if (onCarol.ok) expect(onCarol.envelope.body).toBe('sitrep: perimeter clear');
  });

  it("the owner/admin's outbound is decryptable by all members", async () => {
    const { bob, carol, mgr, group } = await setupTrio();

    await mgr.alice.initOutgoingSession(bob.bundle);
    await mgr.alice.initOutgoingSession(carol.bundle);

    const copies = await broadcast(group, mgr.alice, A, 'all-hands 0800');
    const onBob = await receive(mgr.bob, A, pick(copies, 'bob'), group.masterKeyB64);
    const onCarol = await receive(mgr.carol, A, pick(copies, 'carol'), group.masterKeyB64);

    expect(onBob.ok).toBe(true);
    expect(onCarol.ok).toBe(true);
  });

  // Root cause of B-35: the sender encrypts under a group key the others don't
  // hold. The symmetric layer shows the mechanism directly.
  it('B-35 root: a sender-side key gap makes the outbound undecryptable until the key is shared', async () => {
    const senderKey = genFreshGroupMasterKey();
    const othersKey = genFreshGroupMasterKey(); // members hold a divergent key
    expect(senderKey).not.toBe(othersKey);

    const cipher = await groupEncrypt(senderKey, 'perimeter breach — north gate');

    // B-35 as observed on-device: every other member fails → red banner.
    await expect(groupDecrypt(othersKey, cipher)).rejects.toThrow();

    // Fix condition: once the sender's group key reaches the members, it reads.
    expect(await groupDecrypt(senderKey, cipher)).toBe('perimeter breach — north gate');
  });
});
