import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — user profile + conversation-metadata reads (device-free, client token). */
describe('account · user + conversation reads (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  it('GET /users/me returns a real (non-empty) user record', async () => {
    const r = await authGet('/users/me', token);
    expect(r.status).toBe(200);
    expect(r.json !== null && typeof r.json === 'object').toBe(true);
    expect(Object.keys(r.json).length).toBeGreaterThan(0); // not an empty {}
  });

  it('GET /users/blocked returns an array', async () => {
    const r = await authGet('/users/blocked', token);
    expect(r.status).toBe(200);
    const list = r.json?.blocked ?? r.json;
    expect(Array.isArray(list)).toBe(true);
  });

  it('GET /conversations/mine returns an array', async () => {
    const r = await authGet('/conversations/mine', token);
    expect(r.status).toBe(200);
    const list = r.json?.conversations ?? r.json;
    expect(Array.isArray(list)).toBe(true);
  });
});
