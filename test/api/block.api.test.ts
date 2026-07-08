import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — block → verify → unblock lifecycle (device-free), with teardown.
 * client2 blocks a real other user (the agent), confirms it shows in the block
 * list, and afterAll unblocks (no residue). Access-control write flow.
 */
describe('users · block → verify → unblock (device-free)', () => {
  let token: string;
  let targetUserId: string;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    targetUserId = (await getSession('agent')).userId; // a real user to block
  });

  it('blocks a user', async () => {
    const r = await authPost('/users/block', { userId: targetUserId }, token);
    console.log('BLOCK =>', r.status);
    expect([200, 201]).toContain(r.status);
  });

  it('the blocked user appears in /users/blocked', async () => {
    const r = await authGet('/users/blocked', token);
    expect(r.status).toBe(200);
    const list = r.json?.blocked ?? r.json ?? [];
    console.log('BLOCKED-LIST =>', JSON.stringify(list).slice(0, 160));
    const found =
      Array.isArray(list) &&
      list.some((b: { userId?: string; id?: string }) => (b?.userId ?? b?.id ?? b) === targetUserId);
    expect(found).toBe(true);
  });

  afterAll(async () => {
    const r = await authDelete(`/users/block/${targetUserId}`, token).catch(() => undefined);
    console.log('CLEANUP unblock =>', r?.status);
  });
});
