import { sweepReads } from './support/sweep';
import { msgGet } from './support/http';
import { getSession } from './support/session';

/** M1 — encrypted-backup reads (device-free, MESSENGER service, client token). */
const BACKUP_READS = [
  '/backup/identity/bundle', '/backup/identity/sessions', '/backup/identity/header',
  '/backup/identity/merkle', '/backup/conversations', '/backup/messages', '/backup/sealed-archive',
];

describe('backup · reads (device-free, messenger-service)', () => {
  sweepReads('BACKUP', BACKUP_READS, async () => (await getSession('client2')).token, {
    get: msgGet,
    headers: { 'X-Signal-Device-Id': '1' },
  });
});
