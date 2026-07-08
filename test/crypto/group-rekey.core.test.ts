import {
  makeNewGroup,
  planRemoveAndRekey,
  planAddAndRekey,
  applyAdminAction,
  groupEncrypt,
  groupDecrypt,
} from '@bravo/messenger-core';

/**
 * Phase B — group rekey + forward secrecy, headless (no device).
 * The two properties that matter when membership changes:
 *   - a REMOVED member can't read traffic sent after the rekey
 *   - a newly ADDED member can't read traffic sent before they joined
 */
describe('messenger-core · group rekey & forward secrecy (headless)', () => {
  it('a removed member cannot decrypt post-rekey traffic', async () => {
    const g = makeNewGroup({
      name: 'Detail',
      owner: 'a',
      ownerDeviceId: 1,
      members: [{ userId: 'b', deviceId: 1 }, { userId: 'c', deviceId: 1 }],
    });

    const before = await groupEncrypt(g.masterKeyB64, 'pre-removal');
    expect(await groupDecrypt(g.masterKeyB64, before)).toBe('pre-removal');

    // remove b + rotate the key
    const plan = planRemoveAndRekey(g, 'b');
    const afterRemove = applyAdminAction(g, plan.remove, 'a');
    const afterRekey = applyAdminAction(afterRemove, plan.rekey, 'a');
    expect(afterRekey.masterKeyB64).not.toBe(g.masterKeyB64);
    expect(afterRekey.members.b).toBeUndefined();

    // new-epoch traffic: current members read it; b (holding only the OLD key) can't
    const after = await groupEncrypt(afterRekey.masterKeyB64, 'post-removal secret');
    expect(await groupDecrypt(afterRekey.masterKeyB64, after)).toBe('post-removal secret');
    await expect(groupDecrypt(g.masterKeyB64, after)).rejects.toThrow();
  });

  it('a newly-added member cannot read pre-join traffic (add + rekey)', async () => {
    const g = makeNewGroup({
      name: 'X',
      owner: 'a',
      ownerDeviceId: 1,
      members: [{ userId: 'b', deviceId: 1 }],
    });

    const preJoin = await groupEncrypt(g.masterKeyB64, 'before c joined');

    const plan = planAddAndRekey(g, { userId: 'c', deviceId: 1 });
    const afterAdd = applyAdminAction(g, plan.add, 'a');
    const afterRekey = applyAdminAction(afterAdd, plan.rekey, 'a');
    expect(afterRekey.members.c).toBeTruthy();

    // c only ever holds the NEW key → the pre-join message is unreadable to them
    await expect(groupDecrypt(afterRekey.masterKeyB64, preJoin)).rejects.toThrow();

    // post-join traffic under the new key reads fine
    const postJoin = await groupEncrypt(afterRekey.masterKeyB64, 'after c joined');
    expect(await groupDecrypt(afterRekey.masterKeyB64, postJoin)).toBe('after c joined');
  });
});
