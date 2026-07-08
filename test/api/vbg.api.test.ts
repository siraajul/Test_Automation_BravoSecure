import { sweepReads } from './support/sweep';
import { getSession } from './support/session';

/** M1 — Virtual Bodyguard reads (device-free, client token). POST /vbg/panic is
 * destructive and intentionally NOT exercised here. */
const VBG_READS = ['/vbg/monitoring/status', '/vbg/sra', '/vbg/geofences'];

describe('virtual bodyguard · reads (device-free)', () => {
  sweepReads('VBG', VBG_READS, async () => (await getSession('client2')).token);
});
