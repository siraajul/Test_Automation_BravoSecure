import { authGet, authPost } from './support/http';
import { getSession, type Session } from './support/session';

/**
 * Phase 3 — booking client-CRUD + ops visibility, device-free, on staging.
 * Contract from the NestJS controllers (bookings + ops).
 *
 * Scope note: the full create→approve→dispatch→apply→mission chain is NOT a
 * reliable blind-script test against SHARED staging — approve gates on the
 * booking-state FSM, dispatch needs seeded business data (applicants, vehicles),
 * and the agent side needs KYC/coverage onboarding. Those belong in a seeded
 * env. What IS reliably device-free here is the two-sided *visibility* contract:
 *   - client creates a booking and sees it in their list;
 *   - the ops admin (logged in by phone) is authorized on /ops and sees the
 *     same booking — proving cross-role backend wiring end-to-end.
 *
 * ⚠ Creates a real booking; afterAll ALWAYS cancels it (no debris).
 * 2 logins (client + admin); /auth/login is 5 per 10-min per IP.
 */
const REGION = 'AE';

describe('booking · client CRUD + ops visibility (device-free)', () => {
  let clientS: Session;
  let adminS: Session;
  let bookingId: string | undefined;

  beforeAll(async () => {
    clientS = await getSession('client2');
    adminS = await getSession('admin');
  });

  it('client gets a price estimate', async () => {
    const r = await authPost('/bookings/estimate', { type: 'transfer', add_ons: [], region: REGION, cpo_count: 1 }, clientS.token);
    expect([200, 201]).toContain(r.status);
  });

  it('client creates a booking', async () => {
    const start = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    const r = await authPost(
      '/bookings',
      {
        type: 'transfer',
        pickup: { latitude: 25.2048, longitude: 55.2708, address: 'DIFC, Dubai' },
        dropoff: { latitude: 25.0757, longitude: 55.1395, address: 'Dubai Marina' },
        start_time: start,
        add_ons: [],
        payment_method: 'bravo_credits',
        region: REGION,
        notes: 'API flow test — safe to cancel',
      },
      clientS.token,
    );
    expect([200, 201]).toContain(r.status);
    bookingId = r.json?.booking?.id ?? r.json?.id;
    expect(bookingId).toBeTruthy();
  });

  it('the new booking appears in the client’s own list', async () => {
    const r = await authGet('/bookings', clientS.token);
    expect(r.status).toBe(200);
    const list = r.json?.bookings ?? r.json ?? [];
    expect(list.some((b: { id: string }) => b.id === bookingId)).toBe(true);
  });

  it('the ops admin (phone login) is authorized on /ops and sees the booking', async () => {
    const listed = await authGet('/ops/bookings', adminS.token);
    expect(listed.status).toBe(200); // proves the phone-login admin token passes AdminGuard on /ops

    const detail = await authGet(`/ops/bookings/${bookingId}`, adminS.token);
    expect(detail.status).toBe(200); // ops can see the client’s booking — cross-role wiring
  });

  afterAll(async () => {
    if (bookingId && clientS?.token) {
      const r = await authPost(`/bookings/${bookingId}/cancel`, {}, clientS.token).catch(() => undefined);
      console.log('CLEANUP cancel =>', r?.status);
    }
  });
});
