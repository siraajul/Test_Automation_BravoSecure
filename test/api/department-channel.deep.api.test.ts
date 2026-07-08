import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/** Deep test — POST /department/channels. name Length(1,80) · channel_type enum.
 * Positive (org create+list), negative (validation + authz: non-org 403, no-auth
 * 401). Org-manager guarded. Cleans up. */
describe('POST /department/channels — deep (positive · negative)', () => {
  let org: string;
  let client: string;
  const created: string[] = [];

  beforeAll(async () => {
    org = (await getSession('org')).token;
    client = (await getSession('client2')).token;
  });
  afterAll(async () => {
    for (const id of created) await authDelete(`/department/channels/${id}`, org).catch(() => undefined);
  });

  const create = (b: unknown, t = org) => authPost('/department/channels', b, t);
  const valid = { name: 'Deep Channel', channel_type: 'department' };

  // ── POSITIVE ──
  it('positive: org creates a channel → id, appears in the manage list', async () => {
    const r = await create(valid);
    expect([200, 201]).toContain(r.status);
    expect(r.json?.id).toBeTruthy();
    created.push(r.json.id);
    const list = await authGet('/department/manage/channels', org);
    expect((list.json?.channels ?? []).some((c: { id: string }) => c.id === r.json.id)).toBe(true);
  });

  // ── NEGATIVE (validation) ──
  it('negative: a missing name → 400', async () => {
    const { name, ...b } = valid;
    expect((await create(b)).status).toBe(400);
  });
  it('negative: an empty name → 400', async () => {
    expect((await create({ ...valid, name: '' })).status).toBe(400);
  });
  it('negative: a name over 80 chars → 400', async () => {
    expect((await create({ ...valid, name: 'z'.repeat(81) })).status).toBe(400);
  });
  it('negative: an unknown channel_type → 400', async () => {
    expect((await create({ ...valid, channel_type: 'telepathy' })).status).toBe(400);
  });

  // ── NEGATIVE (authorization) ──
  it('negative: a non-org member is forbidden → 403', async () => {
    const r = await create(valid, client);
    console.log('NON-ORG-CREATE =>', r.status);
    expect([401, 403]).toContain(r.status);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPost('/department/channels', valid)).status).toBe(401);
  });
});
