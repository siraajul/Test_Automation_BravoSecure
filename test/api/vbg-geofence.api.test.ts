import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — VBG geofence create → verify → delete (device-free), with teardown.
 * A zone is a polygon ring (≥3 points). afterAll ALWAYS deletes it.
 */
describe('VBG geofence · create → verify → delete (device-free)', () => {
  let token: string;
  let zoneId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  it('creates a geofence zone', async () => {
    const r = await authPost(
      '/vbg/geofences',
      {
        name: `API Test Zone ${Date.now()}`,
        kind: 'safe',
        ring: [[55.27, 25.20], [55.28, 25.20], [55.275, 25.21]], // Dubai triangle
      },
      token,
    );
    console.log('CREATE-GEOFENCE =>', r.status, JSON.stringify(r.json)?.slice(0, 100));
    expect([200, 201]).toContain(r.status); // 403 here = VBG not entitled for this account
    zoneId = r.json?.id ?? r.json?.zone?.id ?? r.json?.geofence?.id;
    expect(zoneId).toBeTruthy();
  });

  it('appears in /vbg/geofences', async () => {
    const r = await authGet('/vbg/geofences', token);
    expect(r.status).toBe(200);
    const list = r.json?.geofences ?? r.json?.zones ?? r.json ?? [];
    expect(Array.isArray(list) && list.some((z: { id: string }) => z.id === zoneId)).toBe(true);
  });

  afterAll(async () => {
    if (zoneId) {
      const r = await authDelete(`/vbg/geofences/${zoneId}`, token).catch(() => undefined);
      console.log('CLEANUP delete-geofence =>', r?.status);
    }
  });
});
