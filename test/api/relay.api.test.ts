import { msgPost, msgGet } from './support/http';
import { getSession } from './support/session';
import { randomUUID } from 'node:crypto';

/**
 * Phase 2 — message delivery through the REAL messenger relay, device-free.
 * Contract from docs/openapi/bravo-messenger-service.yaml.
 *
 * The relay is sealed-sender: it never persists the sender's identity, only
 * stores opaque bytes keyed by the recipient's (userId, signalDeviceId). So we
 * loopback: one account sends to ITSELF on a dummy signal device (999) that no
 * real device uses — fully exercising store-and-forward + backlog ordering
 * without a second identity and without polluting a real device's queue.
 *
 * Guards B-46/B-47 at the relay layer (the crypto layer is the *.core suite).
 * One /auth/login (rate limit is 5 per 10-min per IP).
 */
const RECIPIENT_DEVICE = 999; // dummy signal device — isolated test queue
const SENDER_DEVICE = '1';
const N = 5;

// base64, ≥60 chars, unique per message so the relay accepts it as opaque bytes.
function fakeSealed(tag: string): string {
  return Buffer.from(`bravo-relay-loopback-${tag}-${'x'.repeat(48)}`).toString('base64');
}

describe('messenger relay · delivery (device-free loopback)', () => {
  let userId: string;
  let token: string;
  const sentIds: string[] = [];

  beforeAll(async () => {
    const s = await getSession('client2');
    userId = s.userId;
    token = s.token;
  });

  it('accepts a burst of envelopes to an offline device (all queued)', async () => {
    for (let i = 0; i < N; i++) {
      const r = await msgPost(
        '/envelopes',
        {
          recipient: { userId, deviceId: RECIPIENT_DEVICE },
          outerSealed: fakeSealed(`${randomUUID()}-msg-${i}`),
          clientMsgId: randomUUID(),
        },
        token,
        { 'X-Signal-Device-Id': SENDER_DEVICE },
      );
      expect(r.status).toBe(202);
      expect(r.json?.envelopeId).toBeTruthy();
      sentIds.push(r.json.envelopeId);
    }
    expect(sentIds).toHaveLength(N);
  });

  it('B-47 shape: the whole backlog pulls back complete and in order', async () => {
    const r = await msgGet('/envelopes?after=0&limit=100', token, {
      'X-Signal-Device-Id': String(RECIPIENT_DEVICE),
    });
    expect(r.status).toBe(200);

    const mine = (r.json?.envelopes ?? [])
      .filter((e: { envelopeId: string }) => sentIds.includes(e.envelopeId))
      .sort((a: { createdAtMs: number }, b: { createdAtMs: number }) => a.createdAtMs - b.createdAtMs);

    // All N arrived, in the order they were sent — the relay-level B-46/B-47 guard.
    expect(mine.map((e: { envelopeId: string }) => e.envelopeId)).toEqual(sentIds);
  });

  afterAll(async () => {
    // Cleanup — ack (hard-delete) the test envelopes so we leave no residue on staging.
    for (const id of sentIds) {
      await msgPost(`/envelopes/${id}/ack`, {}, token, {
        'X-Signal-Device-Id': String(RECIPIENT_DEVICE),
      }).catch(() => undefined);
    }
  });
});
