// Node 18+ exposes WebCrypto/TextEncoder/Buffer globally, so the pure-TS
// libsignal port runs headless. Some runners only expose crypto as
// require('crypto').webcrypto — normalise it onto globalThis.crypto.
import { webcrypto } from 'node:crypto';

if (typeof (globalThis as { crypto?: unknown }).crypto === 'undefined') {
  (globalThis as unknown as { crypto: typeof webcrypto }).crypto = webcrypto;
}

// EC math in JS: a multi-message chain on a cold run can exceed Jest's 5s.
jest.setTimeout(30000);
