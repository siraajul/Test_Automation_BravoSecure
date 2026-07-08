# Headless core tests (`test/integration/`)

Two/three `@bravo/messenger-core` clients talking in a **single Node process** —
the library-level equivalent of driving multiple phones, minus the devices and
UI. This is the layer WhatsApp (libsignal) and Telegram (TDLib) rely on for
delivery correctness. It runs in ~3s and in plain CI (GitHub Actions), no
emulator, no device.

## Retest (run it)

```bash
npm run test:core                 # all *.core.test.ts — 6 tests, ~3s
```

Other ways to run:

```bash
# a single file
./node_modules/.bin/jest --config jest.config.js test/integration/group.delivery.core.test.ts

# verbose (per-test names)
./node_modules/.bin/jest --config jest.config.js --verbose

# watch mode while iterating
./node_modules/.bin/jest --config jest.config.js --watch
```

> Use `npm run test:core` or `./node_modules/.bin/jest …`. Plain `npx jest` does
> not resolve the local binary in this repo.

## Prerequisites

- The app repo checked out at `/Users/sirajul/Desktop/Work/Bravo_Secure`
  (override with `BRAVO_MAIN_REPO=/path npm run test:core`). Nothing is built —
  messenger-core is imported straight from its TypeScript source.
- Deps already in `package.json`: `jest`, `ts-jest`, `@privacyresearch/libsignal-protocol-typescript`,
  `@noble/hashes`. `curve25519-typescript` comes in transitively. No `jose`, no
  native/RN deps.

## What it covers

| File | Asserts | Bug guarded |
|------|---------|-------------|
| `message.roundtrip.core.test.ts` | 1:1 send→relay→fetch→decrypt; offline backlog stays ordered; out-of-order recovery | B-46 / B-47 |
| `group.delivery.core.test.ts` | member's outbound decrypts for all members; admin outbound decrypts for all; sender-side key gap → undecryptable until shared | B-35 |

**Not covered:** rendering. "Decrypts but never shows on screen" (B-18) is a UI
bug — only the device suite catches it. Headless is necessary, not sufficient.

## How it's wired

- **`jest.config.js`** (repo root) — ts-jest, transpile-only (`diagnostics:false`).
  - `moduleNameMapper`: `@bravo/messenger-core` → `support/coreBarrel.ts`;
    `@core/*` → the app repo's `packages/messenger-core/src/*`.
  - `@noble/hashes` v2 is ESM-only, so it's the one node_modules package we let
    ts-jest transpile (`transformIgnorePatterns` + `allowJs`).
- **`support/coreBarrel.ts`** — a **crypto-only** subset of the real messenger-core
  barrel. We avoid the full `src/index.ts` because it re-exports
  `src/transport/client.ts`, which imports `@react-native-async-storage` +
  `socket.io-client` — native deps that don't belong in a headless run.
- **`support/fixtures.ts`** — `makeParty()` (identity + pre-key bundle).
- **`support/relay.ts`** — `InMemoryRelay`, a transient store-and-forward stand-in
  for the messenger relay.
- **`support/setup.ts`** — WebCrypto polyfill + Jest timeout.

## Add a new headless test

1. Name it `*.core.test.ts` under `test/integration/` (that's the `testMatch`).
2. Import from `@bravo/messenger-core` (the barrel mapping handles resolution). If
   you need a symbol that isn't re-exported yet, add it to `support/coreBarrel.ts`
   — but first confirm its source file doesn't import a native dep (only
   `src/transport/client.ts` does; grep for `async-storage`/`socket.io-client`).
3. Build parties with `makeParty`, sessions with `SessionManager`, and pass
   messages through `InMemoryRelay`.
4. `npm run test:core`.

## Testing roadmap (step by step)

**Phase 0 — DONE.** Headless core suite: 1:1 + group delivery (6 tests, CI-ready).

**Phase 1 — Extend the headless core (no device, highest ROI).**
- Rekey / forward secrecy: a removed member cannot decrypt post-rekey traffic
  (`planRemoveAndRekey`); a newly-added member cannot read pre-join messages
  (`planAddAndRekey`).
- Sealed-sender + sender-cert verification path (`verifySenderCert`, `verifySealedAad`).

**Phase 2 — Wire CI (hosted GitHub Actions).**
- `.github/workflows/ci.yml`: run `test:core` on every push (needs the app repo
  available to the runner — vendor messenger-core or check both repos out).

**Phase 3 — Un-gate the web suite (Playwright, hosted).**
- Set `ADMIN_URL` + creds → enable `test/web/admin.login.spec.ts`
  (guards B-39 OTP-not-validated, B-40 signout no-op).

**Phase 4 — Device backstop (thin, nightly, self-hosted).**
- Single-device Appium: a received message actually **renders** in the thread
  (closes the B-18 gap headless can't reach).
- Vault MFA + Backup specs (single-device, security stop-conditions).

**Phase 5 — Multi-device (self-hosted nightly).**
- 3rd account + 2 Android Studio AVDs → enable the multiremote message/group
  specs (`wdio.multiremote.conf.ts`). BlueStacks does NOT work with UiAutomator2.
- Lock the call-screen Accept/End locators on a real 2-device run.

**Phase 6 — Orchestrate.**
- Hosted runner per-push: `test:core` + Playwright. Self-hosted nightly: device
  + multiremote suites. Media/visual call correctness stays manual.
