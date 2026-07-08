import { authGet, authPatch } from './support/http';
import { getSession } from './support/session';

const nameField = (u: Record<string, unknown> | undefined): string | undefined =>
  (u?.displayName as string) ?? (u?.display_name as string);

/** Deep test — PATCH /users/me. displayName is Length(1,80). Positive (persists),
 * negative (bounds + auth), edge (max length). Reverts to the original name. */
describe('PATCH /users/me — deep (positive · negative · edge)', () => {
  let token: string;
  let original: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    original = nameField((await authGet('/users/me', token)).json);
  });
  afterAll(async () => {
    if (original) await authPatch('/users/me', { displayName: original }, token).catch(() => undefined);
  });

  const patch = (b: unknown) => authPatch('/users/me', b, token);

  // ── POSITIVE ──
  it('positive: update displayName → persists', async () => {
    const r = await patch({ displayName: 'Deep QA Name' });
    expect([200, 201]).toContain(r.status);
    expect(nameField((await authGet('/users/me', token)).json)).toBe('Deep QA Name');
  });

  // ── NEGATIVE ──
  it('negative: an empty displayName (min 1) → 400', async () => {
    expect((await patch({ displayName: '' })).status).toBe(400);
  });
  it('negative: a displayName over 80 chars → 400', async () => {
    expect((await patch({ displayName: 'x'.repeat(81) })).status).toBe(400);
  });
  it('negative: a non-string displayName → 400', async () => {
    expect((await patch({ displayName: 12345 })).status).toBe(400);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPatch('/users/me', { displayName: 'x' })).status).toBe(401);
  });

  // ── EDGE ──
  it('edge: displayName at the max (80 chars) is accepted', async () => {
    const r = await patch({ displayName: 'y'.repeat(80) });
    expect([200, 201]).toContain(r.status);
  });
});
