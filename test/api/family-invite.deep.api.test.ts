import { authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/** Deep test — POST /family/invite. Phone must match E.164 (^\+\d{6,15}$).
 * Positive (valid → pending, or 403 entitlement), negative (format + auth). */
describe('POST /family/invite — deep (positive · negative)', () => {
  let token: string;
  let inviteId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });
  afterAll(async () => {
    if (inviteId) await authDelete(`/family/members/${inviteId}`, token).catch(() => undefined);
  });

  const invite = (b: unknown) => authPost('/family/invite', b, token);

  // ── POSITIVE ──
  it('positive: a valid E.164 → pending (or 403 if not entitled)', async () => {
    const r = await invite({ phoneE164: '+8801727994251' });
    expect([200, 201, 403]).toContain(r.status);
    if (r.status < 300) {
      inviteId = r.json?.id;
      expect(r.json?.status).toBe('pending');
    }
  });

  // ── NEGATIVE ──
  it('negative: a phone without the + prefix → 400', async () => {
    expect((await invite({ phoneE164: '8801727994251' })).status).toBe(400);
  });
  it('negative: a too-short phone (< 6 digits) → 400', async () => {
    expect((await invite({ phoneE164: '+123' })).status).toBe(400);
  });
  it('negative: letters in the phone → 400', async () => {
    expect((await invite({ phoneE164: '+88017ABC994' })).status).toBe(400);
  });
  it('negative: a missing phone → 400', async () => {
    expect((await invite({})).status).toBe(400);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPost('/family/invite', { phoneE164: '+8801727994251' })).status).toBe(401);
  });
});
