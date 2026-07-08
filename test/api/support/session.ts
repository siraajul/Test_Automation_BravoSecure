import { authPost, authGet } from './http';
import { env } from '../../../src/config/env';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface Session {
  userId: string;
  token: string;
  refreshToken: string;
}

export type Role = 'client1' | 'client2' | 'admin' | 'agent' | 'org';

// Distinct deviceIds so a shared-suite session never collides with the
// dedicated device the auth.api login/logout tests use ('bravo-api-test').
const ACCOUNTS: Record<Role, { id: string; password: string; deviceId: string }> = {
  client1: { id: env.clients[0].email, password: env.clients[0].password, deviceId: 'bravo-api-c1' },
  client2: { id: env.clients[1].email, password: env.clients[1].password, deviceId: 'bravo-api-c2' },
  admin: { id: env.admin.user, password: env.admin.password, deviceId: 'bravo-api-admin' },
  agent: { id: env.dubaiAgent.email, password: env.dubaiAgent.password, deviceId: 'bravo-api-agent' },
  org: { id: env.org.email, password: env.org.password, deviceId: 'bravo-api-org' },
};

// Memoized per-role login. With jest --runInBand the whole suite shares one
// process, so each role logs in exactly ONCE no matter how many files use it —
// keeping a full-suite run under the /auth/login rate limit (5 per 10-min per IP).
const cache = new Map<Role, Promise<Session>>();

// Disk-backed token cache — lets SEPARATE `jest` runs reuse a still-valid token
// instead of re-logging in, keeping iterative work off the /auth/login rate
// limit (5 per 10-min per IP). Strictly best-effort: any miss/error/expiry falls
// straight through to a fresh login.
const CACHE_FILE = join(tmpdir(), 'bravo-api-sessions.json');
const TTL_MS = 8 * 60 * 1000; // safely within the access-token lifetime

interface CachedSession extends Session {
  at: number;
}

function readDiskCache(): Record<string, CachedSession> {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as Record<string, CachedSession>;
  } catch {
    return {};
  }
}

export function getSession(role: Role): Promise<Session> {
  let p = cache.get(role);
  if (!p) {
    p = resolveSession(role);
    cache.set(role, p);
  }
  return p;
}

async function resolveSession(role: Role): Promise<Session> {
  const a = ACCOUNTS[role];
  // Reuse a fresh, still-valid disk-cached token if one exists.
  try {
    const hit = readDiskCache()[role];
    if (hit && Date.now() - hit.at < TTL_MS) {
      const me = await authGet('/auth/me', hit.token);
      if (me.status === 200) {
        return { userId: hit.userId, token: hit.token, refreshToken: hit.refreshToken };
      }
    }
  } catch {
    /* fall through to a fresh login */
  }
  const s = await loginApi(a.id, a.password, a.deviceId);
  try {
    const disk = readDiskCache();
    disk[role] = { ...s, at: Date.now() };
    writeFileSync(CACHE_FILE, JSON.stringify(disk));
  } catch {
    /* best-effort persistence */
  }
  return s;
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
