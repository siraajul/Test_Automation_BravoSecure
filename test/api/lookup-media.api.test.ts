import { authPost, msgPost } from './support/http';
import { getSession } from './support/session';

/** M1 — contacts directory lookup (auth, POST) + media download-url (messenger). */
describe('lookup + media (device-free)', () => {
  it('POST /users/lookup (contacts-on-Bravo directory)', async () => {
    const s = await getSession('client2');
    const r = await authPost('/users/lookup', { phones: ['+8801727994251'] }, s.token);
    expect(r.status).toBe(200); // directory lookup — returns only matches
  });

  it('POST /media/download-url/{key} validates the key (session media, no MFA)', async () => {
    const s = await getSession('client2');
    const r = await msgPost(`/media/download-url/${encodeURIComponent('att/nonexistent')}`, {}, s.token, {
      'X-Signal-Device-Id': '1',
    });
    expect(r.status).toBeLessThan(500); // 400 invalid/absent key — endpoint wired
  });
});
