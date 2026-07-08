import { authGet } from './support/http';
import { getSession } from './support/session';

/**
 * M1 — family + sender-cert reads (device-free, client token).
 *
 * Findings while building this: `/news/*` is NOT an auth-service route (no news
 * controller — the feed is client-side), and subscriptions is `/subscription`
 * (singular) and POST-only, so neither is an auth-service read endpoint.
 */
describe('misc · family + sender-cert reads (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  for (const path of ['/family/members', '/family/usage', '/sender-cert/revocation-list']) {
    it(`GET ${path}`, async () => {
      const r = await authGet(path, token);
      expect(r.status).toBe(200);
    });
  }
});
