import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — ops booking detail (device-free, admin token). Chains off the ops
 * booking list to read a real booking + its proposed payouts. */
describe('ops · booking detail (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('admin')).token;
  });

  it('GET /ops/bookings → detail + proposed-payouts', async () => {
    const list = await authGet('/ops/bookings', token);
    expect(list.status).toBe(200);
    const bookings = list.json?.bookings ?? list.json ?? [];
    console.log('OPS-BOOKINGS =>', Array.isArray(bookings) ? bookings.length : typeof bookings);
    if (Array.isArray(bookings) && bookings.length > 0) {
      const id = bookings[0].id ?? bookings[0].booking_id;
      const detail = await authGet(`/ops/bookings/${id}`, token);
      const payouts = await authGet(`/ops/bookings/${id}/proposed-payouts`, token);
      expect(detail.status).toBe(200);
      expect(payouts.status).toBe(200);
    }
  });
});
