import { authPost } from './http';
import { env } from '../../../src/config/env';

export interface Session {
  userId: string;
  token: string;
  refreshToken: string;
}

export type Role = 'client1' | 'client2' | 'admin' | 'agent';

// Distinct deviceIds so a shared-suite session never collides with the
// dedicated device the auth.api login/logout tests use ('bravo-api-test').
const ACCOUNTS: Record<Role, { id: string; password: string; deviceId: string }> = {
  client1: { id: env.clients[0].email, password: env.clients[0].password, deviceId: 'bravo-api-c1' },
  client2: { id: env.clients[1].email, password: env.clients[1].password, deviceId: 'bravo-api-c2' },
  admin: { id: env.admin.user, password: env.admin.password, deviceId: 'bravo-api-admin' },
  agent: { id: env.dubaiAgent.email, password: env.dubaiAgent.password, deviceId: 'bravo-api-agent' },
};

// Memoized per-role login. With jest --runInBand the whole suite shares one
// process, so each role logs in exactly ONCE no matter how many files use it —
// keeping a full-suite run under the /auth/login rate limit (5 per 10-min per IP).
const cache = new Map<Role, Promise<Session>>();

export function getSession(role: Role): Promise<Session> {
  let p = cache.get(role);
  if (!p) {
    const a = ACCOUNTS[role];
    p = loginApi(a.id, a.password, a.deviceId);
    cache.set(role, p);
  }
  return p;
}

/**
 * Device-free login: /auth/login → /auth/verify → tokens. Staging stubs the
 * OTP (any 4–8 digit code passes), so we use a fixed one. Throws with a clear
 * message on the rate limit (5 /auth/login per 10-min window per IP) so a
 * throttled run reads obviously instead of as a cryptic assertion failure.
 */
export async function loginApi(identifier: string, password: string, deviceId: string): Promise<Session> {
  // identifier is an email, or a phone in E.164 form (starts with '+')
  const idField = identifier.startsWith('+') ? { phoneE164: identifier } : { email: identifier };
  const login = await authPost('/auth/login', { ...idField, password });
  if (login.status === 429) {
    throw new Error('RATE-LIMITED on /auth/login (5 per 10-min per IP) — wait ~10 min and retry');
  }
  if (login.status !== 200 || !login.json?.userId) {
    throw new Error(`login failed: ${login.status} ${login.text}`);
  }
  const verify = await authPost('/auth/verify', {
    userId: login.json.userId,
    code: '123456',
    deviceId,
    platform: 'android',
  });
  if (verify.status !== 200 || !verify.json?.accessToken) {
    throw new Error(`verify failed: ${verify.status} ${verify.text}`);
  }
  return {
    userId: login.json.userId,
    token: verify.json.accessToken,
    refreshToken: verify.json.refreshToken,
  };
}
