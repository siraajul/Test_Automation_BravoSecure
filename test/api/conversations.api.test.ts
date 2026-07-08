import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — conversation detail reads (device-free, client token). Chains off
 * /conversations/mine to read a real conversation id when one exists. */
describe('conversations · detail (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  it('GET /conversations/mine → detail + members', async () => {
    const mine = await authGet('/conversations/mine', token);
    expect(mine.status).toBe(200);
    const list = mine.json?.conversations ?? mine.json ?? [];
    console.log('CONVOS =>', Array.isArray(list) ? list.length : typeof list);
    if (Array.isArray(list) && list.length > 0) {
      const id = list[0].id ?? list[0].conversationId;
      const detail = await authGet(`/conversations/${id}`, token);
      const members = await authGet(`/conversations/${id}/members`, token);
      console.log('CONVO-DETAIL =>', detail.status, 'MEMBERS =>', members.status);
      expect(detail.status).toBeLessThan(500);
      expect(members.status).toBeLessThan(500);
    }
  });
});
