import { authGet, msgGet, msgPost } from './support/http';
import { getSession, type Session } from './support/session';
import { expectShape } from './support/shape';
import { randomUUID } from 'node:crypto';

/**
 * Phase 4 — security & state gates, device-free, on staging. All NON-destructive
 * (reads + a rejection check). Contracts from docs/openapi/bravo-messenger-service.yaml
 * and the auth-service wallet/sos controllers.
 *
 * Guards:
 *  - File Vault MFA stop-condition — a download URL must be REFUSED without a
 *    fresh X-Mfa-Proof, even with a valid JWT (CLAUDE.md security constraint).
 *  - B-41 — TURN credentials issue cleanly (a drifted secret would 500).
 *
 * The real SOS insert (POST /sos/raise) and VBG panic page live ops, so they are
 * NOT triggered here — only the non-destructive /sos/:id/status read. A full B-49
 * insert check needs an explicit destructive opt-in.
 *
 * One /auth/login (rate limit 5 per 10-min per IP).
 */
const SIGNAL_DEVICE = { 'X-Signal-Device-Id': '1' };

describe('security & state gates (device-free)', () => {
  let s: Session;

  beforeAll(async () => {
    s = await getSession('client2');
  });

  it('File Vault: download URL is refused without X-Mfa-Proof (401)', async () => {
    // Valid-format, non-existent key so the MFA gate is what trips, not key format.
    const key = encodeURIComponent(`vault/${randomUUID()}`);
    const r = await msgPost(`/vault/download-url/${key}`, {}, s.token, SIGNAL_DEVICE); // no X-Mfa-Proof
    expect(r.status).toBe(401); // the File Vault MFA gate holds even with a valid JWT
  });

  it('B-41: TURN credentials are issued (secret not drifted)', async () => {
    const r = await msgGet('/webrtc/turn-credentials', s.token, SIGNAL_DEVICE);
    expect(r.status).toBe(200); // a drifted/missing secret would be 500 turn_not_configured
    expectShape(r.json, { username: 'string', credential: 'string' });
  });

  it('wallet balance is readable', async () => {
    const r = await authGet('/wallet/balance', s.token);
    expect(r.status).toBe(200);
    console.log('WALLET =>', JSON.stringify(r.json)?.slice(0, 120));
  });

  it('SOS status endpoint is wired (bogus id → 404, non-destructive)', async () => {
    const r = await authGet(`/sos/${randomUUID()}/status`, s.token);
    expect([404, 400]).toContain(r.status); // endpoint reachable; no SOS raised
  });
});
