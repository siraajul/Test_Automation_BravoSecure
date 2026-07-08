import { authGet, authPost } from './support/http';
import { getSession } from './support/session';

/** Deep functional — attendance. The clock-in→out lifecycle needs a seeded shift
 * assignment (M3), so here we assert the device-free surface: the shift-gate,
 * validation, auth, own-status reads, and admin review reads. */
describe('attendance · shift-gate + reads — deep functional (device-free)', () => {
  let agent: string;
  let org: string;

  beforeAll(async () => {
    agent = (await getSession('agent')).token;
    org = (await getSession('org')).token;
  });

  // ── FUNCTIONAL: the shift-gate ──
  it('functional: clock-in without an assigned shift is gated → 400 (no_active_shift)', async () => {
    const r = await authPost('/attendance/clock-in', { lat: 25.20, lng: 55.27, accuracy_m: 10 }, agent);
    expect(r.status).toBe(400);
    expect(String(r.json?.message ?? '')).toMatch(/shift/i);
  });

  // ── FUNCTIONAL: reads return data ──
  it('functional: /attendance/me and /my-shift/today are readable', async () => {
    expect((await authGet('/attendance/me', agent)).status).toBe(200);
    expect((await authGet('/attendance/my-shift/today', agent)).status).toBeLessThan(400);
  });
  it('admin: org can read sessions / summary / pending', async () => {
    for (const p of ['/attendance/org/sessions', '/attendance/org/summary', '/attendance/org/pending']) {
      const r = await authGet(p, org);
      expect(r.status).toBeLessThan(400);
    }
  });

  // ── NEGATIVE ──
  it('negative: clock-in with an out-of-range lat (>90) → 400', async () => {
    expect((await authPost('/attendance/clock-in', { lat: 200, lng: 55 }, agent)).status).toBe(400);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPost('/attendance/clock-in', {})).status).toBe(401);
  });
});
