import { authGet, authPatch } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — profile update → verify → revert (device-free). Changes displayName,
 * confirms the change persisted, and afterAll reverts to the original value
 * (teardown-by-restore — no lasting change to the account).
 */
const nameField = (u: Record<string, unknown> | undefined): string | undefined =>
  (u?.displayName as string) ?? (u?.display_name as string) ?? ((u?.user as any)?.displayName as string);

describe('profile · update → verify → revert (device-free)', () => {
  let token: string;
  let original: string | undefined;
  const newName = 'API Test Name';

  beforeAll(async () => {
    token = (await getSession('client2')).token;
    const me = await authGet('/users/me', token);
    original = nameField(me.json);
    console.log('ORIGINAL-NAME =>', original);
  });

  it('updates displayName and it persists', async () => {
    const upd = await authPatch('/users/me', { displayName: newName }, token);
    expect([200, 201]).toContain(upd.status);
    const after = await authGet('/users/me', token);
    expect(nameField(after.json)).toBe(newName);
  });

  afterAll(async () => {
    if (original) {
      await authPatch('/users/me', { displayName: original }, token).catch(() => undefined);
      console.log('CLEANUP revert-name =>', original);
    }
  });
});
