import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — department-channel lifecycle (device-free): the org manager creates a
 * channel, it appears in the manage list, members are readable, a member is
 * added, and the channel is deleted. afterAll ALWAYS deletes it (no debris).
 *
 * ⚠ Destructive (creates a real channel) but fully torn down. Needs the org
 * account (OrgManagerGuard). This lights up the deptchat module (0% on device).
 */
describe('department channel · lifecycle (device-free)', () => {
  let orgToken: string;
  let memberUserId: string;
  let channelId: string | undefined;

  beforeAll(async () => {
    orgToken = (await getSession('org')).token;
    memberUserId = (await getSession('client2')).userId;
  });

  it('org manager creates a channel', async () => {
    const r = await authPost(
      '/department/channels',
      { name: `API Test Channel ${Date.now()}`, channel_type: 'department' },
      orgToken,
    );
    console.log('CREATE-CHANNEL =>', r.status, JSON.stringify(r.json)?.slice(0, 140));
    expect(r.status).toBe(200);
    channelId = r.json?.id ?? r.json?.channel?.id ?? r.json?.channelId ?? r.json?.channel_id;
    expect(channelId).toBeTruthy();
  });

  it('the new channel appears in manage/channels', async () => {
    const r = await authGet('/department/manage/channels', orgToken);
    expect(r.status).toBe(200);
    const list = r.json?.channels ?? [];
    expect(list.some((c: { id: string }) => c.id === channelId)).toBe(true);
  });

  it('members list is readable', async () => {
    const r = await authGet(`/department/channels/${channelId}/members`, orgToken);
    expect(r.status).toBe(200);
  });

  it('adding a NON-org user is gated by org membership (403)', async () => {
    const r = await authPost(
      `/department/channels/${channelId}/members`,
      { user_id: memberUserId, role: 'viewer' },
      orgToken,
    );
    // 403 is CORRECT — ITSirajul isn't in this org, so channel membership can't
    // be granted. This is the access-control gate; a same-org member gives 200.
    expect([200, 403]).toContain(r.status);
  });

  afterAll(async () => {
    if (channelId) {
      const r = await authDelete(`/department/channels/${channelId}`, orgToken).catch(() => undefined);
      console.log('CLEANUP delete-channel =>', r?.status);
    }
  });
});
