import { sweepReads } from './support/sweep';
import { getSession } from './support/session';

/** M1 — org-manager + attendance reads (device-free, org token). */
const ORG_READS = [
  '/org/cpos', '/org/earnings', '/org/missions', '/org/missions/completed', '/org/summary',
  '/attendance/org/pending', '/attendance/org/sessions', '/attendance/org/summary',
  '/attendance/shifts',
];

describe('org + attendance · read sweep (device-free)', () => {
  sweepReads('ORG', ORG_READS, async () => (await getSession('org')).token);
});
