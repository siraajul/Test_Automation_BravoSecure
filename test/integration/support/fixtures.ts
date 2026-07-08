import {
  InMemoryProtocolStore,
  installIdentity,
  buildOwnPreKeyBundle,
  type PreKeyBundle,
  type SessionAddress,
} from '@bravo/messenger-core';

/**
 * Spin up a fully-initialized store for one participant: identity key, signed
 * pre-key, and one one-time pre-key (id = 1). Returns everything the other side
 * needs to open a session. Mirrors the main repo's __tests__/fixtures.ts.
 */
export async function makeParty(address: SessionAddress): Promise<{
  store: InMemoryProtocolStore;
  address: SessionAddress;
  bundle: PreKeyBundle;
}> {
  const store = new InMemoryProtocolStore();
  await installIdentity(store, { preKeyCount: 1 });
  const bundle = await buildOwnPreKeyBundle(store, address, 1, 1);
  return { store, address, bundle };
}
