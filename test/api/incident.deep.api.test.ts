import { authGet, authPost, authPatch } from './support/http';
import { getSession } from './support/session';

/** Deep functional — incident reporting. Reporter side is fully device-free
 * (create → submitted → mine → detail). Manager triage needs the incident's OWN
 * org manager, so we assert cross-org isolation instead (a security property).
 * No DELETE route → one automated-marked incident per run stays in 'submitted'. */
describe('incident · report + isolation — deep functional (device-free)', () => {
  let reporter: string;
  let otherOrgManager: string;
  let incidentId: string | undefined;

  beforeAll(async () => {
    reporter = (await getSession('agent')).token;
    otherOrgManager = (await getSession('org')).token; // a manager of a DIFFERENT org
  });

  const valid = {
    category: 'safety_issue',
    severity: 'low',
    description: 'AUTOMATED TEST incident — please ignore. Device-free QA suite.',
  };
  const create = (b: unknown, t = reporter) => authPost('/incidents', b, t);

  // ── POSITIVE — reporter lifecycle ──
  it('positive: reporter files an incident → submitted (+ ref), in /incidents/mine', async () => {
    const r = await create(valid);
    console.log('INCIDENT-CREATE =>', r.status, JSON.stringify(r.json)?.slice(0, 160));
    expect([200, 201]).toContain(r.status);
    expect(r.json?.status).toBe('submitted');
    incidentId = r.json?.id;
    expect(incidentId).toBeTruthy();
    const mine = await authGet('/incidents/mine', reporter);
    expect((mine.json?.incidents ?? mine.json ?? []).some((i: { id: string }) => i.id === incidentId)).toBe(true);
  });
  it('positive: reporter reads their own incident detail', async () => {
    if (!incidentId) throw new Error('no incident');
    const d = await authGet(`/incidents/${incidentId}`, reporter);
    console.log('INCIDENT-DETAIL =>', JSON.stringify(d.json)?.slice(0, 140));
    expect(d.status).toBe(200);
    expect(JSON.stringify(d.json)).toContain(incidentId); // detail is about this incident
    expect(JSON.stringify(d.json)).toContain('submitted'); // carries its status
  });

  // ── SECURITY — org isolation ──
  it('security: a manager from another org cannot triage this incident → 404', async () => {
    if (!incidentId) throw new Error('no incident');
    const r = await authPatch(`/incidents/${incidentId}/status`, { to: 'received' }, otherOrgManager);
    console.log('CROSS-ORG-TRIAGE =>', r.status);
    expect(r.status).toBe(404); // incident_not_found_in_org — correct dept-scoping
  });
  it('security: a manager from another org cannot read this incident → 403/404', async () => {
    if (!incidentId) throw new Error('no incident');
    const r = await authGet(`/incidents/${incidentId}`, otherOrgManager);
    expect([403, 404]).toContain(r.status);
  });

  // ── NEGATIVE — validation ──
  it('negative: an unknown category → 400', async () => {
    expect((await create({ ...valid, category: 'alien_sighting' })).status).toBe(400);
  });
  it('negative: an unknown severity → 400', async () => {
    expect((await create({ ...valid, severity: 'apocalyptic' })).status).toBe(400);
  });
  it('negative: an empty description → 400', async () => {
    expect((await create({ ...valid, description: '' })).status).toBe(400);
  });
  it('negative: no auth → 401', async () => {
    expect((await authPost('/incidents', valid)).status).toBe(401);
  });
});
