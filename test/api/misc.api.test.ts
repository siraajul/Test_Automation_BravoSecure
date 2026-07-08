import { sweepReads } from './support/sweep';
import { getSession } from './support/session';

/** M1 — family + sender-cert reads (device-free, client token). */
const MISC_READS = ['/family/members', '/family/usage', '/sender-cert/revocation-list'];

describe('misc · family + sender-cert reads (device-free)', () => {
  sweepReads('MISC', MISC_READS, async () => (await getSession('client2')).token);
});
