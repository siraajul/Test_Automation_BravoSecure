import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — Signal pre-key bundle fetch (device-free, client token). */
describe('signal keys · read (device-free)', () => {
  it('GET /auth/keys/{userId} returns a prekey bundle', async () => {
    const s = await getSession('client2');
    const r = await authGet(`/auth/keys/${s.userId}`, s.token);
    expect(r.status).toBe(200);
  });
});
