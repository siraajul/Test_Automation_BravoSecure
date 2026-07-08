import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/** Deep test — users block/unblock. Positive (full round-trip), negative
 * (validation + auth), edge (idempotency). Cleans up. */
describe('users block/unblock — deep (positive · negative · edge)', () => {
  let token: string;
  let target: string;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    target = (await getSession('agent')).userId;
  });
  afterAll(async () => {
    await authDelete(`/users/block/${target}`, token).catch(() => undefined);
  });

  const blocked = async (): Promise<string[]> => {
    const r = await authGet('/users/blocked', token);
    return (r.json?.blocked ?? r.json ?? []).map((b: { userId?: string; id?: string }) => b?.userId ?? b?.id);
  };

  // ── POSITIVE ──
  it('positive: block → appears in list → unblock → gone', async () => {
    expect([200, 201]).toContain((await authPost('/users/block', { userId: target }, token)).status);
    expect(await blocked()).toContain(target);
    expect([200, 204]).toContain((await authDelete(`/users/block/${target}`, token)).status);
    expect(await blocked()).not.toContain(target);
  });

  // ── NEGATIVE ──
  it('negative: block a non-UUID userId → 400', async () => {
    expect((await authPost('/users/block', { userId: 'not-a-uuid' }, token)).status).toBe(400);
  });
  it('negative: block with an empty body → 400', async () => {
    expect((await authPost('/users/block', {}, token)).status).toBe(400);
  });
  it('negative: block with no auth → 401', async () => {
    expect((await authPost('/users/block', { userId: target })).status).toBe(401);
  });

  // ── EDGE ──
  it('edge: blocking the same user twice is idempotent (no error)', async () => {
    await authPost('/users/block', { userId: target }, token);
    const second = await authPost('/users/block', { userId: target }, token);
    expect(second.status).toBeLessThan(400);
    await authDelete(`/users/block/${target}`, token);
  });
});
