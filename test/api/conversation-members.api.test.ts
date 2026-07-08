import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — group conversation member add → verify → remove, wrapped in create/delete
 * (device-free), with teardown. Exercises the membership write endpoints.
 */
describe('conversation · add → verify → remove member (device-free)', () => {
  let token: string;
  let memberUserId: string;
  let convoId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    memberUserId = (await getSession('org')).userId; // a real user to add/remove
  });

  it('creates a group conversation', async () => {
    const seed = (await getSession('agent')).userId;
    const r = await authPost('/conversations', { kind: 'group', title: 'API Test Group', memberUserIds: [seed] }, token);
    expect([200, 201]).toContain(r.status);
    convoId = r.json?.id ?? r.json?.conversation?.id;
    expect(convoId).toBeTruthy();
  });

  it('adds a member, sees them, then removes them', async () => {
    const add = await authPost(`/conversations/${convoId}/members`, { userId: memberUserId }, token);
    console.log('ADD-MEMBER =>', add.status);
    expect([200, 201]).toContain(add.status);

    // members come back in the conversation detail (no GET :id/members route)
    const detail = await authGet(`/conversations/${convoId}`, token);
    expect(detail.status).toBe(200);
    const list = detail.json?.members ?? detail.json?.participants ?? [];
    console.log('MEMBERS =>', JSON.stringify(list).slice(0, 160));
    expect(list.some((m: { userId?: string; id?: string }) => (m?.userId ?? m?.id) === memberUserId)).toBe(true);

    const remove = await authDelete(`/conversations/${convoId}/members/${memberUserId}`, token);
    console.log('REMOVE-MEMBER =>', remove.status);
    expect([200, 204]).toContain(remove.status);
  });

  afterAll(async () => {
    if (convoId) {
      const r = await authDelete(`/conversations/${convoId}`, token).catch(() => undefined);
      console.log('CLEANUP delete-convo =>', r?.status);
    }
  });
});
