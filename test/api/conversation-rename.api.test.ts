import { authGet, authPost, authPatch, authDelete } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — conversation rename → verify → delete (device-free), with teardown.
 * Create a group, PATCH its title, confirm the new title reads back, delete it.
 */
describe('conversation · rename → verify → delete (device-free)', () => {
  let token: string;
  let convoId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  it('creates, renames, and verifies the new title', async () => {
    const peer = (await getSession('agent')).userId;
    const create = await authPost('/conversations', { kind: 'group', title: 'Original Title', memberUserIds: [peer] }, token);
    expect([200, 201]).toContain(create.status);
    convoId = create.json?.id;
    expect(convoId).toBeTruthy();

    const rename = await authPatch(`/conversations/${convoId}`, { title: 'Renamed Group' }, token);
    expect([200, 201]).toContain(rename.status);

    const detail = await authGet(`/conversations/${convoId}`, token);
    expect(detail.status).toBe(200);
    expect(detail.json?.title).toBe('Renamed Group');
  });

  afterAll(async () => {
    if (convoId) {
      const r = await authDelete(`/conversations/${convoId}`, token).catch(() => undefined);
      console.log('CLEANUP delete-convo =>', r?.status);
    }
  });
});
