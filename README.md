# Bravo Secure — Test Automation

Automated tests for **Bravo Secure** across **three device-free layers** (run
anywhere, no phone) plus a **device E2E** layer (needs a real device, WIP).

> New here? Read this file top-to-bottom, then [`SYSTEM_MAP.md`](SYSTEM_MAP.md)
> for what the app itself does.

---

## The mental model (start here)

There are **4 layers**. The first three need **no device** and run in ~20 s:

| Layer | Folder | What it tests | Run | Device? |
|-------|--------|---------------|-----|:------:|
| **API** | `test/api/` | 527 tests — auth, messaging, booking, ops, VBG, dept, incidents, attendance, family | `npm run test:api` | ❌ |
| **Headless crypto** | `test/crypto/` | Signal protocol: 1:1 delivery, group delivery, rekey + forward secrecy | `npm run test:core` | ❌ |
| **Web (ops console)** | `test/web/` | Playwright — admin login (phone+password+OTP), nav | `npm run test:admin` | ❌ |
| **Device E2E** | `test/device/` | Appium/WebdriverIO on a real device — **blocked** on env (see below) | `npm run wdio` | ✅ |

**~538 device-free tests, 100% green.** Everything that needs a phone is quarantined
in the device layer so it doesn't get in the way of the automated suite.

---

## Directory map

```
test/                        ← the 4 layers, one folder each
  api/            device-free API suite (527 tests). START HERE.
    *.api.test.ts        breadth: reads, write lifecycles, guard sweep
    *.deep.api.test.ts   depth: positive + negative + edge per endpoint
    support/             http.ts · session.ts (login cache) · shape.ts · sweep.ts · routes.json
  crypto/         device-free headless crypto. *.core.test.ts + support/coreBarrel.ts
  web/            device-free Playwright ops-console specs (*.spec.ts)
  device/         device E2E (needs a phone) — one folder for ALL device tests:
    auth/   client/   cpo/   comms/   smoke/    ← screen/flow specs
    journeys/                                    ← multi-phase (book → dispatch → mission)
    setup/                                       ← device bring-up / restore helpers

src/                         ← the framework the specs use (Page Object Model)
  config/         env.ts (typed creds from credentials.env), capabilities.ts
  mobile/         Page Objects + flows for the Android app (client + cpo)
  web/            Page Objects + flows for the ops console
  helpers/        selectors, glyphs

.github/workflows/  CI (typecheck on every push)
docs/scratch/       relocated ad-hoc notes (job dumps from exploration)
scripts/            device/adb helper shell scripts
```

### Naming convention in `test/api/`
- `foo.api.test.ts` — breadth/lifecycle (reachability, CRUD round-trips, guard sweep)
- `foo.deep.api.test.ts` — **deep**: positive + negative + edge cases for one endpoint

---

## Commands

```bash
npm install                 # first, after any clone/clean (node_modules is gitignored)

# device-free (no phone) — the everyday suite:
npm run test:api            # API tests against live staging
npm run test:core           # headless-crypto tests
npm run test:admin          # web ops-console tests (needs: npm run install:browsers once)

# device E2E (needs a connected device + running Appium):
npm run wdio                # WebdriverIO device suite
```

---

## Setup

1. `npm install`
2. Copy `credentials.env.example` → `credentials.env` and fill in the staging
   accounts/URLs. **`credentials.env` is gitignored — never commit it.**
3. Device-free layers need nothing else. For the web layer run
   `npm run install:browsers` once (Playwright Chromium).
4. Device E2E needs a connected Android device + Appium — see [`MULTIDEVICE.md`](MULTIDEVICE.md).

---

## What's gitignored (don't be alarmed by disk size)

`node_modules/`, `apk/` (built APKs), `allure-results/`, `allure-report/`,
`test-results/`, `playwright-report/`, `.playwright-mcp/`, `.explore/`,
`credentials.env`, `*.log`. All regenerable — safe to delete to reclaim space.

---

## Device E2E — currently blocked

The device layer is scaffolded but blocked on environment: it needs a **debuggable
app build** (for token-injection login) or a biometric-enabled emulator, plus a
seeded test environment for the destructive flows. Until then, the **device-free
layers above are the source of truth.** See [`MULTIDEVICE.md`](MULTIDEVICE.md).
