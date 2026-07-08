import routes from './support/routes.json';
import { AUTH_BASE, MSG_BASE } from './support/http';

/**
 * Phase A — every protected endpoint must reject an unauthenticated request.
 * Hits ALL routes with NO token: the JWT guard fires before any handler, so this
 * exercises every route (coverage) + verifies auth-gating, and is completely
 * non-destructive (nothing runs — not even /sos/raise or /vbg/panic).
 * A 2xx here would be a missing-guard security bug.
 */
type Route = { service: 'auth' | 'msg'; method: string; path: string };

// Public / signature-gated / pre-auth (not JWT) — excluded from the "requires
// auth" assertion. Verified live: each returns a non-401 by design.
const PUBLIC = new Set([
  '/auth/health', '/auth/register', '/auth/register/verify', '/auth/login', '/auth/verify',
  '/auth/refresh', '/auth/session/refresh', '/auth/messenger-ticket',
  '/auth/totp/verify', '/auth/admin/accept-invite', '/auth/admin-register/verify',
  '/sender-cert/revocation-list', // public CRL by design
  '/healthz', '/health', '/ready', '/metrics', '/livez', '/readyz',
]);
// Dead routes (commented out in the controller — extractor picks up the string).
const DEAD = new Set(['/agents/:id/review/open', '/agents/:id/review/decision']);
const isPublic = (p: string): boolean =>
  PUBLIC.has(p) || DEAD.has(p) || /webhook|health|metrics|ready|livez|\.well-known|revocation-list/i.test(p);

async function callNoAuth(r: Route): Promise<number> {
  const base = r.service === 'msg' ? MSG_BASE : AUTH_BASE;
  const path = r.path.replace(/:[A-Za-z][A-Za-z0-9_]*/g, '00000000-0000-0000-0000-000000000000');
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method);
  const res = await fetch(base + path, {
    method: r.method,
    headers: { 'Content-Type': 'application/json' },
    body: hasBody ? '{}' : undefined,
  });
  return res.status;
}

describe('API · guard sweep — every protected endpoint rejects no-auth (401)', () => {
  const protectedRoutes = (routes as Route[]).filter((r) => !isPublic(r.path));

  for (const r of protectedRoutes) {
    it(`${r.method} ${r.path}`, async () => {
      const status = await callNoAuth(r);
      if (status !== 401) console.log('NON-401', r.method, r.path, '=>', status);
      expect(status).toBe(401);
    });
  }
});
