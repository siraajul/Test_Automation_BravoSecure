import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — ops-console reads (device-free, admin token via phone login). */
describe('ops · admin reads (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('admin')).token;
  });

  it('GET /ops/me returns the admin identity', async () => {
    const r = await authGet('/ops/me', token);
    expect(r.status).toBe(200);
  });

  it('GET /ops/dashboard', async () => {
    const r = await authGet('/ops/dashboard', token);
    expect(r.status).toBe(200);
  });

  it('GET /ops/bookings lists bookings', async () => {
    const r = await authGet('/ops/bookings', token);
    expect(r.status).toBe(200);
  });

  it('GET /ops/deptchat/incidents is reachable', async () => {
    const r = await authGet('/ops/deptchat/incidents', token);
    expect(r.status).toBeLessThan(500);
  });

  it('GET /ops/deptchat/attendance/summary is reachable', async () => {
    const r = await authGet('/ops/deptchat/attendance/summary', token);
    expect(r.status).toBeLessThan(500);
  });
});
