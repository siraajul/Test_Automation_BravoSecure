import { sweepReads } from './support/sweep';
import { getSession } from './support/session';

/** M1 — remaining client-side reads (device-free, client token). */
const CLIENT_READS = [
  '/bookings/add-ons', '/bookings/regions/availability',
  '/conversations/membership-intents',
  '/family/invites', '/family/membership',
  '/vbg/favorites', '/vbg/keypoints', '/vbg/threats', '/vbg/track',
  '/compliance/me',
];

describe('client · remaining read sweep (device-free)', () => {
  sweepReads('CLIENT', CLIENT_READS, async () => (await getSession('client2')).token);
});
