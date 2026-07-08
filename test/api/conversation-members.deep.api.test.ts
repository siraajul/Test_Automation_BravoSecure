import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/** Deep test — POST /conversations/:id/members. Positive (add → visible in
 * detail), negative (bad uuid, empty body, no-auth, not-a-member). Cleans up. */
describe('POST /conversations/:id/members — deep (positive · negative)', () => {
  let token: string;
  let member: string;
  let convoId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    member = (await getSession('org')).userId;
    const peer = (await getSession('agent')).userId;
    const r = await authPost('/conversations', { kind: 'group', title: 'Members Deep', memberUserIds: [peer] }, token);
    convoId = r.json?.id;
  });
  afterAll(async () => {
    if (convoId) await authDelete(`/conversations/${convoId}`, token).catch(() => undefined);
  });

  const addMember = (b: unknown) => authPost(`/conversations/${convoId}/members`, b, token);

  // ── POSITIVE ──
  it('positive: add a member → appears in the conversation detail', async () => {
    expect([200, 201]).toContain((await addMember({ userId: member })).status);
    const d = await authGet(`/conversations/${convoId}`, token);
    const members = d.json?.members ?? [];
    expect(members.some((m: { userId?: string; id?: string }) => (m.userId ?? m.id) === member)).toBe(true);
  });

  // ── NEGATIVE ──
  it('negative: a non-UUID member → 400', async () => {
    expect((await addMember({ userId: 'nope' })).status).toBe(400);
  });
  it('negative: an empty body → 400', async () => {
    expect((await addMember({})).status).toBe(400);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPost(`/conversations/${convoId}/members`, { userId: member })).status).toBe(401);
  });
  it('negative: adding to a conversation you are not in → 403/404', async () => {
    const r = await authPost('/conversations/00000000-0000-0000-0000-000000000000/members', { userId: member }, token);
    expect([403, 404]).toContain(r.status);
  });
});
