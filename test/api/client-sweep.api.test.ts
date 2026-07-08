import { authGet } from './support/http';
import { getSession } from './support/session';

/** M1 — remaining client-side reads (device-free, client token). Reachability. */
const CLIENT_READS = [
  '/bookings/add-ons', '/bookings/regions/availability',
  '/conversations/membership-intents',
  '/family/invites', '/family/membership',
  '/vbg/favorites', '/vbg/keypoints', '/vbg/threats', '/vbg/track',
  '/compliance/me',
];

describe('client · remaining read sweep (device-free)', () => {
  let token: string;
  beforeAll(async () => { token = (await getSession('client2')).token; });

  for (const path of CLIENT_READS) {
    it(`GET ${path}`, async () => {
      const r = await authGet(path, token);
      if (r.status >= 400) console.log('CLIENT', path, '=>', r.status);
      expect(r.status).toBeLessThan(500);
    });
  }
});
