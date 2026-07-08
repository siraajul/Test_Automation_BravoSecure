import { authPost } from './support/http';
import { getSession } from './support/session';
import { expectShape } from './support/shape';

/**
 * Deep test — POST /bookings/estimate. Positive (valid → price), negative
 * (every validation rule + auth), and edge (boundary values). DTO rules:
 * type ∈ transfer|timeslot|itinerary · region required · cpo_count 1–4 ·
 * duration_hours 1–24 · add_ons required array.
 */
describe('POST /bookings/estimate — deep (positive · negative · edge)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });
  const est = (body: unknown) => authPost('/bookings/estimate', body, token);
  const valid = { type: 'transfer', add_ons: [] as string[], region: 'AE', cpo_count: 1 };

  // ── POSITIVE ──
  it('positive: a valid request returns a price object', async () => {
    const r = await est(valid);
    expect([200, 201]).toContain(r.status);
    expectShape(r.json, { total: 'number', rate_per_hour: 'number', total_aed: 'number' });
    expect(r.json.total).toBeGreaterThan(0);
  });

  // ── NEGATIVE (validation) ──
  it('negative: missing region → 400', async () => {
    const { region, ...body } = valid;
    expect((await est(body)).status).toBe(400);
  });
  it('negative: missing type → 400', async () => {
    const { type, ...body } = valid;
    expect((await est(body)).status).toBe(400);
  });
  it('negative: unknown type value → 400', async () => {
    expect((await est({ ...valid, type: 'spaceship' })).status).toBe(400);
  });
  it('negative: missing add_ons array → 400', async () => {
    const { add_ons, ...body } = valid;
    expect((await est(body)).status).toBe(400);
  });
  it('negative: cpo_count below min (0) → 400', async () => {
    expect((await est({ ...valid, cpo_count: 0 })).status).toBe(400);
  });
  it('negative: cpo_count above max (5) → 400', async () => {
    expect((await est({ ...valid, cpo_count: 5 })).status).toBe(400);
  });
  it('negative: duration_hours above max (25) → 400', async () => {
    expect((await est({ ...valid, duration_hours: 25 })).status).toBe(400);
  });

  // ── NEGATIVE (auth) ──
  it('negative: no auth token → 401', async () => {
    expect((await authPost('/bookings/estimate', valid)).status).toBe(401);
  });

  // ── EDGE (boundaries) ──
  it('edge: cpo_count at the min (1) is accepted', async () => {
    expect([200, 201]).toContain((await est({ ...valid, cpo_count: 1 })).status);
  });
  it('edge: cpo_count at the max (4) is accepted', async () => {
    expect([200, 201]).toContain((await est({ ...valid, cpo_count: 4 })).status);
  });
  it('edge: duration_hours at the max (24) is accepted', async () => {
    expect([200, 201]).toContain((await est({ ...valid, duration_hours: 24 })).status);
  });
});
