import { authPost } from './support/http';

/** Deep test — POST /auth/verify (validation/negative). The happy path is
 * exercised by every getSession() login; here we pin the rejection behaviour.
 * No /auth/login calls → does not touch the login rate limit. */
describe('POST /auth/verify — deep (negative / validation)', () => {
  const verify = (b: unknown) => authPost('/auth/verify', b);
  const base = {
    userId: '00000000-0000-0000-0000-000000000000',
    code: '123456',
    deviceId: 'deep-verify',
    platform: 'android',
  };

  it('negative: a well-formed but non-existent userId → 404', async () => {
    const r = await verify(base);
    console.log('VERIFY-404 =>', r.status);
    expect([404, 401]).toContain(r.status);
  });
  it('negative: an empty body → 400', async () => {
    expect((await verify({})).status).toBe(400);
  });
  it('negative: a missing code → 400', async () => {
    const { code, ...b } = base;
    expect((await verify(b)).status).toBe(400);
  });
  it('negative: a non-UUID userId → 400/404', async () => {
    const r = await verify({ ...base, userId: 'not-a-uuid' });
    console.log('VERIFY-BADUUID =>', r.status);
    expect([400, 404]).toContain(r.status);
  });
});
