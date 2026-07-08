import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — remaining agent reads + public health (device-free). Reachability. */
const AGENT_READS = [
  '/agents/me/open-jobs', '/attendance/me', '/attendance/my-shift/today',
  '/dispatch/offers/current', '/dispatch/room-intents', '/incidents/mine', '/incidents/queue',
];
const PUBLIC_READS = ['/metrics', '/ready'];

describe('agent + public · read sweep (device-free)', () => {
  let token: string;
  beforeAll(async () => { token = (await getSession('agent')).token; });

  for (const path of AGENT_READS) {
    it(`GET ${path} (agent)`, async () => {
      const r = await authGet(path, token);
      if (r.status >= 400) console.log('AGENT', path, '=>', r.status);
      expect(r.status).toBeLessThan(500);
    });
  }

  for (const path of PUBLIC_READS) {
    it(`GET ${path} (public)`, async () => {
      const r = await authGet(path);
      if (r.status >= 400) console.log('PUBLIC', path, '=>', r.status);
      expect(r.status).toBeLessThan(500);
    });
  }
});
