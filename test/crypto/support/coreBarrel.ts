// Faithful CRYPTO-ONLY subset of the real `@bravo/messenger-core` barrel,
// re-exported straight from the main-repo source (mapped via '@core/*' in
// jest.config.js). Specs import from '@bravo/messenger-core' exactly as the
// production tests do; this file just keeps the headless suite clear of the
// native deps the full barrel pulls in through src/transport/client.ts
// (@react-native-async-storage/async-storage, socket.io-client).
export * from '@core/crypto/types';
export * from '@core/crypto/errors';
export { SessionManager } from '@core/crypto/sessionManager';
export { InMemoryProtocolStore } from '@core/crypto/inMemoryStore';
export { installIdentity, buildOwnPreKeyBundle } from '@core/crypto/identity';
export { toBase64, fromBase64, addressKey } from '@core/crypto/encoding';

// Group delivery surface (all clean of native deps — verified imports:
// only relative + @noble/hashes + @privacyresearch/curve25519-typescript).
export { unsealPayload } from '@core/crypto/sealedSender';
export { groupEncrypt, groupDecrypt } from '@core/crypto/groupCrypto';
export {
  broadcastToGroup,
  parseGroupMessage,
  makeNewGroup,
  genFreshGroupMasterKey,
  planRemoveAndRekey,
  planAddAndRekey,
  applyAdminAction,
} from '@core/groups/groupClient';
export * from '@core/groups/types';
