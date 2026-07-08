import { msgGet } from './support/http';
import { getSession } from './support/session';

/** M1 — encrypted-backup reads (device-free, MESSENGER service, client token).
 * Finding: these are messenger-service routes, not auth-service. */
const BACKUP_READS = [
  '/backup/identity/bundle', '/backup/identity/sessions', '/backup/identity/header',
  '/backup/identity/merkle', '/backup/conversations', '/backup/messages', '/backup/sealed-archive',
];

describe('backup · reads (device-free, messenger-service)', () => {
  let token: string;
  beforeAll(async () => { token = (await getSession('client2')).token; });

  for (const path of BACKUP_READS) {
    it(`GET ${path}`, async () => {
      const r = await msgGet(path, token, { 'X-Signal-Device-Id': '1' });
      if (r.status >= 400) console.log('BACKUP', path, '=>', r.status);
      expect(r.status).toBeLessThan(500);
    });
  }
});
