import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — Virtual Bodyguard reads (device-free, client token). Reachability-level;
 * POST /vbg/panic is destructive and intentionally NOT exercised here. */
describe('virtual bodyguard · reads (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  it('GET /vbg/monitoring/status is reachable', async () => {
    const r = await authGet('/vbg/monitoring/status', token);
    expect(r.status).toBeLessThan(500);
  });

  it('GET /vbg/sra is reachable', async () => {
    const r = await authGet('/vbg/sra', token);
    expect(r.status).toBeLessThan(500);
  });

  it('GET /vbg/geofences is reachable', async () => {
    const r = await authGet('/vbg/geofences', token);
    expect(r.status).toBeLessThan(500);
  });
});
