import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — agent-side reads (device-free, agent token). The Dubai agent is
 * onboarded, so these all return 200 (empty marketplace / no active mission). */
describe('agents · reads (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('agent')).token;
  });

  for (const path of [
    '/agents/me',
    '/agents/me/available-jobs',
    '/agents/me/applications',
    '/agents/me/active-mission',
    '/agents/me/missions',
  ]) {
    it(`GET ${path}`, async () => {
      const r = await authGet(path, token);
      expect(r.status).toBe(200);
    });
  }
});
