import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — department-chat reads (device-free, client token). Reachability-level:
 * a client with no department membership still gets a valid (often empty) 2xx,
 * never a 5xx — that's the contract we assert for the dark deptchat module. */
describe('department chats · reads (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  it('GET /department/channels is reachable', async () => {
    const r = await authGet('/department/channels', token);
    expect(r.status).toBeLessThan(500);
  });

  it('GET /department/manage/channels is reachable', async () => {
    const r = await authGet('/department/manage/channels', token);
    expect(r.status).toBeLessThan(500);
  });

  it('GET /department/membership-intents is reachable', async () => {
    const r = await authGet('/department/membership-intents', token);
    expect(r.status).toBeLessThan(500);
  });
});
