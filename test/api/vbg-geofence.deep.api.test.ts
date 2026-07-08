import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/** Deep test — POST /vbg/geofences. Polygon rules: name ≤80 · kind ∈ safe|danger
 * · ring ≥3 points. Positive (create+list), negative (validation+auth), edge
 * (min polygon). Cleans up every zone it creates. */
describe('POST /vbg/geofences — deep (positive · negative · edge)', () => {
  let token: string;
  const created: string[] = [];

  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });
  afterAll(async () => {
    for (const id of created) await authDelete(`/vbg/geofences/${id}`, token).catch(() => undefined);
  });

  const ring3: Array<[number, number]> = [[55.27, 25.20], [55.28, 25.20], [55.275, 25.21]];
  const valid = { name: 'Deep Zone', kind: 'safe', ring: ring3 };
  const create = (b: unknown) => authPost('/vbg/geofences', b, token);

  // ── POSITIVE ──
  it('positive: a valid polygon → id and appears in the list', async () => {
    const r = await create(valid);
    expect([200, 201]).toContain(r.status);
    expect(r.json?.id).toBeTruthy();
    created.push(r.json.id);
    const list = await authGet('/vbg/geofences', token);
    const zones = list.json?.geofences ?? list.json?.zones ?? list.json ?? [];
    expect(zones.some((z: { id: string }) => z.id === r.json.id)).toBe(true);
  });

  // ── NEGATIVE ──
  it('negative: a ring with < 3 points → 400', async () => {
    expect((await create({ ...valid, ring: [[55.27, 25.20], [55.28, 25.20]] })).status).toBe(400);
  });
  it('negative: an unknown kind → 400', async () => {
    expect((await create({ ...valid, kind: 'nuclear' })).status).toBe(400);
  });
  it('negative: a missing name → 400', async () => {
    const { name, ...b } = valid;
    expect((await create(b)).status).toBe(400);
  });
  it('negative: a name over 80 chars → 400', async () => {
    expect((await create({ ...valid, name: 'z'.repeat(81) })).status).toBe(400);
  });
  it('negative: an empty body → 400', async () => {
    expect((await create({})).status).toBe(400);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPost('/vbg/geofences', valid)).status).toBe(401);
  });

  // ── EDGE ──
  it('edge: exactly 3 points (the minimum polygon) is accepted', async () => {
    const r = await create({ ...valid, ring: ring3 });
    expect([200, 201]).toContain(r.status);
    if (r.json?.id) created.push(r.json.id);
  });
});
