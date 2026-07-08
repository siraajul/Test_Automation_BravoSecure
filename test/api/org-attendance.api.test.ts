import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — org-manager + attendance reads (device-free, org token). Reachability. */
const ORG_READS = [
  '/org/cpos', '/org/earnings', '/org/missions', '/org/missions/completed', '/org/summary',
  '/attendance/org/pending', '/attendance/org/sessions', '/attendance/org/summary',
  '/attendance/shifts',
];

describe('org + attendance · read sweep (device-free)', () => {
  let token: string;
  beforeAll(async () => { token = (await getSession('org')).token; });

  for (const path of ORG_READS) {
    it(`GET ${path}`, async () => {
      const r = await authGet(path, token);
      if (r.status >= 400) console.log('ORG', path, '=>', r.status);
      expect(r.status).toBeLessThan(500);
    });
  }
});
