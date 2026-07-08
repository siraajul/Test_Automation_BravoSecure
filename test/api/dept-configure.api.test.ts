import { authGet, authPost, authPatch, authDelete } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — department channel configure (PATCH) + archive (device-free), teardown.
 * create → rename via configure → verify in manage list → archive → delete.
 */
describe('department channel · configure + archive (device-free)', () => {
  let token: string;
  let channelId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('org')).token;
  });

  it('create → configure → verify → archive', async () => {
    const create = await authPost('/department/channels', { name: 'Cfg Test', channel_type: 'department' }, token);
    expect([200, 201]).toContain(create.status);
    channelId = create.json?.id;
    expect(channelId).toBeTruthy();

    const cfg = await authPatch(`/department/channels/${channelId}`, { name: 'Reconfigured' }, token);
    expect([200, 201]).toContain(cfg.status);

    const list = await authGet('/department/manage/channels', token);
    const ch = (list.json?.channels ?? []).find((c: { id: string }) => c.id === channelId);
    expect(ch?.name).toBe('Reconfigured');

    const arch = await authPost(`/department/channels/${channelId}/archive`, {}, token);
    console.log('ARCHIVE =>', arch.status);
    expect([200, 201]).toContain(arch.status);
  });

  afterAll(async () => {
    if (channelId) {
      const r = await authDelete(`/department/channels/${channelId}`, token).catch(() => undefined);
      console.log('CLEANUP delete-channel =>', r?.status);
    }
  });
});
