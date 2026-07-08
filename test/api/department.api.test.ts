import { sweepReads } from './support/sweep';
import { getSession } from './support/session';

/** M1 — department-chat reads (device-free, client token). */
const DEPT_READS = [
  '/department/channels', '/department/manage/channels', '/department/membership-intents',
];

describe('department chats · reads (device-free)', () => {
  sweepReads('DEPT', DEPT_READS, async () => (await getSession('client2')).token);
});
