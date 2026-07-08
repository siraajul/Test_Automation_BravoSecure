import { authGet, msgGet } from './support/http';

/** M1 — public health endpoints (device-free, no auth). */
describe('health · public endpoints (device-free)', () => {
  it('GET /auth/health (auth-service)', async () => {
    const r = await authGet('/auth/health');
    expect(r.status).toBe(200);
  });

  it('GET /healthz (messenger-service)', async () => {
    const r = await msgGet('/healthz');
    expect(r.status).toBe(200);
  });
});
