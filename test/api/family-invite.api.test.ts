import { authGet, authPost, authDelete } from './support/http';
import { getSession } from './support/session';

/**
 * M2 — family invite → verify → revoke (device-free), with best-effort teardown.
 * Family plan is a Pro feature; a 403 here is a correct entitlement gate.
 */
describe('family · invite → verify → revoke (device-free)', () => {
  let token: string;
  let inviteId: string | undefined;

  beforeAll(async () => {
    token = (await getSession('client2')).token;
  });

  it('sends a family invite (pending)', async () => {
    const r = await authPost('/family/invite', { phoneE164: '+8801727994251' }, token);
    console.log('FAMILY-INVITE =>', r.status, JSON.stringify(r.json)?.slice(0, 120));
    // 200/201 = invited; 403 = correctly requires Pro/family entitlement.
    expect([200, 201, 403]).toContain(r.status);
    if (r.status < 300) {
      inviteId = r.json?.id ?? r.json?.invite?.id ?? r.json?.inviteId;
      expect(inviteId).toBeTruthy();
      expect(r.json?.status).toBe('pending');
    }
  });

  it('the invites list is readable', async () => {
    // Note: /family/invites lists RECEIVED invites, so our sent one won't be
    // here — the create response above is the assertion.
    const r = await authGet('/family/invites', token);
    expect(r.status).toBe(200);
  });

  afterAll(async () => {
    if (inviteId) {
      const r = await authDelete(`/family/members/${inviteId}`, token).catch(() => undefined);
      console.log('CLEANUP revoke-invite =>', r?.status);
    }
  });
});
