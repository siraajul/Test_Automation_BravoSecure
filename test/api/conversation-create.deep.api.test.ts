import { authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/** Deep test — POST /conversations. Positive (direct + group), negative (every
 * validation rule + auth). Cleans up all created conversations. */
describe('POST /conversations — deep (positive · negative)', () => {
  let token: string;
  let peer: string;
  const created: string[] = [];

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    peer = (await getSession('agent')).userId;
  });
  afterAll(async () => {
    for (const id of created) await authDelete(`/conversations/${id}`, token).catch(() => undefined);
  });

  // ── POSITIVE ──
  it('positive: create a direct conversation → id + kind=direct', async () => {
    const r = await authPost('/conversations', { kind: 'direct', memberUserIds: [peer] }, token);
    expect([200, 201]).toContain(r.status);
    expect(r.json?.id).toBeTruthy();
    expect(r.json?.kind).toBe('direct');
    created.push(r.json.id);
  });
  it('positive: create a group with a title', async () => {
    const r = await authPost('/conversations', { kind: 'group', title: 'Deep Test', memberUserIds: [peer] }, token);
    expect([200, 201]).toContain(r.status);
    if (r.json?.id) created.push(r.json.id);
  });

  // ── NEGATIVE ──
  it('negative: empty body → 400', async () => {
    expect((await authPost('/conversations', {}, token)).status).toBe(400);
  });
  it('negative: unknown kind → 400', async () => {
    expect((await authPost('/conversations', { kind: 'broadcast', memberUserIds: [peer] }, token)).status).toBe(400);
  });
  it('negative: empty memberUserIds (min 1) → 400', async () => {
    expect((await authPost('/conversations', { kind: 'direct', memberUserIds: [] }, token)).status).toBe(400);
  });
  it('negative: a non-UUID member → 400', async () => {
    expect((await authPost('/conversations', { kind: 'direct', memberUserIds: ['nope'] }, token)).status).toBe(400);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPost('/conversations', { kind: 'direct', memberUserIds: [peer] })).status).toBe(401);
  });
});
