import { authPost, authGet, authDelete } from './support/http';
import { env } from '../../src/config/env';

/**
 * Phase 1 — auth-service session flow, entirely device-free (HTTP only).
 * Contract from docs/openapi/bravo-auth-service.yaml.
 *
 * Guards:
 *  - credential check is enumeration-safe (wrong password → userId null, not 401)
 *  - B-40: logout (DELETE /auth/session) revokes the token immediately
 *
 * Staging note: Twilio OTP is STUBBED — any 4–8 digit code passes /auth/verify
 * by design. So "wrong OTP is accepted" is expected here; whether PROD validates
 * the OTP (the real B-39 question) can only be checked against prod.
 *
 * Rate limit: /auth/login is 5 per 10-min window per IP — this suite makes 2.
 */
const acct = env.clients[0]; // Shirajul (client1)
const DEVICE_ID = 'bravo-api-test'; // dedicated test device — won't touch real sessions

describe('auth-service API · session flow (device-free)', () => {
  let userId: string;
  let token: string;

  it('login with the correct password returns a userId (OTP dispatched)', async () => {
    const r = await authPost('/auth/login', { email: acct.email, password: acct.password });
    expect(r.status).toBe(200);
    expect(r.json?.userId).toBeTruthy();
    userId = r.json.userId;
  });

  it('login with a WRONG password is enumeration-safe (userId null, still 200)', async () => {
    const r = await authPost('/auth/login', { email: acct.email, password: 'definitely-wrong-pw' });
    expect(r.status).toBe(200);
    expect(r.json?.userId).toBeNull(); // credential check works, but no user-enumeration
  });

  it('verify issues an access + refresh token (staging stubs OTP: any 4–8 digits)', async () => {
    const r = await authPost('/auth/verify', {
      userId,
      code: '123456',
      deviceId: DEVICE_ID,
      platform: 'android',
    });
    expect(r.status).toBe(200);
    expect(typeof r.json?.accessToken).toBe('string');
    expect(typeof r.json?.refreshToken).toBe('string');
    token = r.json.accessToken;
  });

  it('verify with a non-existent userId → 404 user_not_found', async () => {
    const r = await authPost('/auth/verify', {
      userId: '00000000-0000-0000-0000-000000000000',
      code: '123456',
      deviceId: DEVICE_ID,
      platform: 'android',
    });
    expect(r.status).toBe(404);
  });

  it('GET /auth/me with the token returns the current user', async () => {
    const r = await authGet('/auth/me', token);
    expect(r.status).toBe(200);
    expect(r.json?.user).toBeTruthy();
  });

  it('GET /auth/me with a garbage token → 401', async () => {
    const r = await authGet('/auth/me', 'not-a-real-token');
    expect(r.status).toBe(401);
  });

  // B-40 guard — logout must invalidate the bearer immediately (jti revoked in Redis).
  it('B-40: DELETE /auth/session revokes the token — a later /auth/me is 401', async () => {
    const del = await authDelete('/auth/session', token, { deviceId: DEVICE_ID });
    expect(del.status).toBe(200);

    const me = await authGet('/auth/me', token);
    // If this comes back 200, the session was NOT revoked → B-40 reproduced.
    expect(me.status).toBe(401);
  });
});
