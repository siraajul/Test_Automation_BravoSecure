import { sweepReads } from './support/sweep';
import { getSession } from './support/session';

/** M1 — full ops-console read sweep (device-free, admin token). Each 200 is
 * verified to return a real payload, not just a status. */
const OPS_READS = [
  '/ops/admins', '/ops/admins/invites', '/ops/agents', '/ops/analytics', '/ops/audit',
  '/ops/broadcasts/recent', '/ops/departments', '/ops/disputes',
  '/ops/finance/escrows', '/ops/finance/invoices', '/ops/finance/payouts',
  '/ops/finance/promos', '/ops/finance/transactions', '/ops/jobs', '/ops/missions',
  '/ops/pool/vehicles', '/ops/sos', '/ops/users', '/ops/vbg/monitoring',
  '/ops/dispatch/killswitch', '/ops/dispatch/monitor', '/ops/dispatch/requests',
];

describe('ops · full read sweep (device-free)', () => {
  sweepReads('OPS', OPS_READS, async () => (await getSession('admin')).token);
});
