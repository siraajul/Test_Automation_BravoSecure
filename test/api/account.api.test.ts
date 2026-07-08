import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — user profile + conversation-metadata reads (device-free, client token). */
describe('account · user + conversation reads (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  it('GET /users/me returns the profile', async () => {
    const r = await authGet('/users/me', token);
    expect(r.status).toBe(200);
  });

  it('GET /users/blocked returns the block list', async () => {
    const r = await authGet('/users/blocked', token);
    expect(r.status).toBe(200);
  });

  it('GET /conversations/mine returns the conversation list', async () => {
    const r = await authGet('/conversations/mine', token);
    expect(r.status).toBe(200);
  });
});
