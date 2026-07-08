import { authGet, authPatch } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — privacy setting toggle → verify → revert (device-free). PATCH-only
 * endpoint (GET /users/me/privacy is 404); we verify via /users/me if it
 * reflects the flag, and afterAll restores the original value.
 */
const lastSeen = (u: Record<string, unknown> | undefined): boolean | undefined =>
  (u?.lastSeenVisible as boolean) ?? (u?.last_seen_visible as boolean);

describe('privacy · toggle → revert (device-free)', () => {
  let token: string;
  let original: boolean | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    const me = await authGet('/users/me', token);
    original = lastSeen(me.json);
    console.log('ORIGINAL-lastSeen =>', original);
  });

  it('PATCH /users/me/privacy toggles lastSeenVisible', async () => {
    const target = original === false ? true : false;
    const r = await authPatch('/users/me/privacy', { lastSeenVisible: target }, token);
    expect([200, 201]).toContain(r.status);

    const me = await authGet('/users/me', token);
    const now = lastSeen(me.json);
    if (now !== undefined) expect(now).toBe(target); // verify it actually persisted
  });

  afterAll(async () => {
    if (original !== undefined) {
      await authPatch('/users/me/privacy', { lastSeenVisible: original }, token).catch(() => undefined);
      console.log('CLEANUP revert-privacy =>', original);
    }
  });
});
