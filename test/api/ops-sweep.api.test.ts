import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — full ops-console read sweep (device-free, admin token). Reachability. */
const OPS_READS = [
  '/ops/admins', '/ops/admins/invites', '/ops/agents', '/ops/analytics', '/ops/audit',
  '/ops/broadcasts/recent', '/ops/departments', '/ops/disputes',
  '/ops/finance/escrows', '/ops/finance/invoices', '/ops/finance/payouts',
  '/ops/finance/promos', '/ops/finance/transactions', '/ops/jobs', '/ops/missions',
  '/ops/pool/vehicles', '/ops/sos', '/ops/users', '/ops/vbg/monitoring',
  '/ops/dispatch/killswitch', '/ops/dispatch/monitor', '/ops/dispatch/requests',
];

describe('ops · full read sweep (device-free)', () => {
  let token: string;
  beforeAll(async () => { token = (await getSession('admin')).token; });

  for (const path of OPS_READS) {
    it(`GET ${path}`, async () => {
      const r = await authGet(path, token);
      if (r.status >= 400) console.log('OPS', path, '=>', r.status);
      expect(r.status).toBeLessThan(500);
    });
  }
});
