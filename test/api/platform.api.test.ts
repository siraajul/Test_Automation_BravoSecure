import { msgGet } from './support/http';
import { getSession } from './support/session';

/**
 * M1 — SFU (group-call) runtime stats read (device-free, messenger).
 * Finding: GET /users/me/privacy is 404 — privacy is set via PATCH (a write),
 * so it belongs in the M2 write sweep, not this read sweep.
 */
describe('platform · sfu stats (device-free)', () => {
  it('GET /sfu/stats', async () => {
    const s = await getSession('client2');
    const r = await msgGet('/sfu/stats', s.token, { 'X-Signal-Device-Id': '1' });
    expect(r.status).toBe(200);
  });
});
