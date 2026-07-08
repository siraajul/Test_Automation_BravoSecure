import { sweepReads } from './support/sweep';
import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — remaining agent reads (smart sweep) + public health (may be non-JSON). */
const AGENT_READS = [
  '/agents/me/open-jobs', '/attendance/me', '/attendance/my-shift/today',
  '/dispatch/offers/current', '/dispatch/room-intents', '/incidents/mine', '/incidents/queue',
];
const PUBLIC_READS = ['/metrics', '/ready'];

describe('agent + public · read sweep (device-free)', () => {
  sweepReads('AGENT2', AGENT_READS, async () => (await getSession('agent')).token);

  describe('public (no auth)', () => {
    for (const path of PUBLIC_READS) {
      it(`GET ${path}`, async () => {
        const r = await authGet(path);
        if (r.status >= 400) console.log('PUBLIC', path, '=>', r.status);
        expect(r.status).toBeLessThan(500);
      });
    }
  });
});
