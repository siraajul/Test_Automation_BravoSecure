import { authGet, authPost } from './support/http';
import { getSession } from './support/session';

/**
 * Phase A — error paths & guards (device-free). The reads/writes prove the happy
 * path; these prove the API correctly REJECTS bad/unauthorized requests.
 */
describe('API · error paths & guards (device-free)', () => {
  let client: string;

  beforeAll(async () => {
    client = (await getSession('client2')).token;
  });

  it('no token → 401 on a protected route', async () => {
    const r = await authGet('/users/me');
    expect(r.status).toBe(401);
  });

  it('a garbage token → 401', async () => {
    const r = await authGet('/users/me', 'garbage.token.value');
    expect(r.status).toBe(401);
  });

  it('a client token is forbidden on the ops console (admin-only)', async () => {
    const r = await authGet('/ops/dashboard', client);
    expect([401, 403]).toContain(r.status);
  });

  it('bad input: create booking with an empty body → 400', async () => {
    const r = await authPost('/bookings', {}, client);
    expect(r.status).toBe(400);
  });

  it('bad input: block a non-UUID userId → 400', async () => {
    const r = await authPost('/users/block', { userId: 'not-a-uuid' }, client);
    expect(r.status).toBe(400);
  });

  it('bad input: create conversation with an empty body → 400', async () => {
    const r = await authPost('/conversations', {}, client);
    expect(r.status).toBe(400);
  });

  it('verify with a non-existent userId → 404', async () => {
    const r = await authPost('/auth/verify', {
      userId: '00000000-0000-0000-0000-000000000000',
      code: '123456',
      deviceId: 'err-path',
      platform: 'android',
    });
    expect(r.status).toBe(404);
  });
});
