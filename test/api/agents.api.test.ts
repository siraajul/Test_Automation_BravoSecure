import { sweepReads } from './support/sweep';
import { getSession } from './support/session';

/** M1 — agent-side reads (device-free, agent token). Each 200 returns a real payload. */
const AGENT_READS = [
  '/agents/me',
  '/agents/me/available-jobs',
  '/agents/me/applications',
  '/agents/me/active-mission',
  '/agents/me/missions',
];

describe('agents · reads (device-free)', () => {
  sweepReads('AGENT', AGENT_READS, async () => (await getSession('agent')).token);
});
