import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — conversation create → read → delete lifecycle (device-free), teardown.
 * This also *creates the data* the M1 detail-reads couldn't reach (the test
 * account had 0 conversations). afterAll ALWAYS deletes it.
 */
describe('conversation · create → read → delete (device-free)', () => {
  let token: string;
  let peerUserId: string;
  let convoId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    peerUserId = (await getSession('agent')).userId;
  });

  it('creates a direct conversation', async () => {
    const r = await authPost('/conversations', { kind: 'direct', memberUserIds: [peerUserId] }, token);
    console.log('CREATE-CONVO =>', r.status, JSON.stringify(r.json)?.slice(0, 120));
    expect([200, 201]).toContain(r.status);
    convoId = r.json?.id ?? r.json?.conversation?.id ?? r.json?.conversationId;
    expect(convoId).toBeTruthy();
  });

  it('appears in /conversations/mine and reads back by id', async () => {
    const mine = await authGet('/conversations/mine', token);
    expect(mine.status).toBe(200);
    const list = mine.json?.conversations ?? mine.json ?? [];
    expect(list.some((c: { id: string }) => c.id === convoId)).toBe(true);

    const detail = await authGet(`/conversations/${convoId}`, token);
    expect(detail.status).toBe(200);
  });

  afterAll(async () => {
    if (convoId) {
      const r = await authDelete(`/conversations/${convoId}`, token).catch(() => undefined);
      console.log('CLEANUP delete-convo =>', r?.status);
    }
  });
});
