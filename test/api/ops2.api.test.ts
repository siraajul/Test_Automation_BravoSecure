import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — additional ops-console reads (device-free, admin token). */
describe('ops · extra admin reads (device-free)', () => {
  let token: string;
  beforeAll(async () => {
    token = (await getSession('admin')).token;
  });

  for (const path of ['/ops/activity', '/ops/compliance/pending']) {
    it(`GET ${path}`, async () => {
      const r = await authGet(path, token);
      expect(r.status).toBe(200);
    });
  }
});
