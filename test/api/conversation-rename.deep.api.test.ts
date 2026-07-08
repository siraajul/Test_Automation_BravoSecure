import { authGet, authPost, authPatch, authDelete } from './support/http';
import { getSession } from './support/session';

/** Deep test — PATCH /conversations/:id. title Length(1,80). Positive (rename
 * persists), negative (bounds, auth, not-found). Creates one group, cleans up. */
describe('PATCH /conversations/:id — deep (positive · negative)', () => {
  let token: string;
  let convoId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    const peer = (await getSession('agent')).userId;
    const r = await authPost('/conversations', { kind: 'group', title: 'Rename Deep', memberUserIds: [peer] }, token);
    convoId = r.json?.id;
  });
  afterAll(async () => {
    if (convoId) await authDelete(`/conversations/${convoId}`, token).catch(() => undefined);
  });

  const rename = (b: unknown) => authPatch(`/conversations/${convoId}`, b, token);

  // ── POSITIVE ──
  it('positive: rename → the new title reads back', async () => {
    expect([200, 201]).toContain((await rename({ title: 'Renamed Deep' })).status);
    const d = await authGet(`/conversations/${convoId}`, token);
    expect(d.json?.title).toBe('Renamed Deep');
  });

  // ── NEGATIVE ──
  it('negative: an empty title (min 1) → 400', async () => {
    expect((await rename({ title: '' })).status).toBe(400);
  });
  it('negative: a title over 80 chars → 400', async () => {
    expect((await rename({ title: 'x'.repeat(81) })).status).toBe(400);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPatch(`/conversations/${convoId}`, { title: 'x' })).status).toBe(401);
  });
  it('negative: renaming a conversation you are not in → 403/404', async () => {
    const r = await authPatch('/conversations/00000000-0000-0000-0000-000000000000', { title: 'x' }, token);
    expect([403, 404]).toContain(r.status);
  });
});
