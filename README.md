# Bravo Secure — Test Automation

The automated test suite for **Bravo Secure**. Its core idea in one sentence:
**the app is a thin client over ~332 backend API routes and the Signal Protocol,
so the vast majority of behaviour can be tested with no phone at all** — and this
repo does exactly that (**538 device-free tests, 100% green, one command, ~20 s**),
keeping the slow, flaky device layer as a thin cap on top.

> **New here?** Read this file top to bottom. Then [`SYSTEM_MAP.md`](SYSTEM_MAP.md)
> for what the app itself does, and [`MULTIDEVICE.md`](MULTIDEVICE.md) for the
> device-testing plan.

---

## 1 · What we're testing (the app under test)

**Bravo Secure** (by OmniDevX Studio) is a Middle-East-focused (UAE / KSA)
**executive-protection & secure-communications super-app** — three products behind
one login:

| Product | What it is |
|---|---|
| **Bravo Messenger** | Signal-Protocol **E2E-encrypted** chat, groups, voice/video, file vault, intel feed |
| **Bravo Secure** | on-demand **physical close-protection** booking (CPOs, executive transport, VIP security) |
| **Virtual Bodyguard** (Pro) | AI **personal-safety monitoring** — geofence, live tracking, OSINT threat intel, panic button |

It's a **two-sided marketplace** ("Uber for close protection"): the same login
routes a **Client** to booking/messaging and a **CP Agent** to a job dashboard.
The loop: *client books → ops dispatches → agent accepts → runs a live mission.*

**Stack under test:** React Native (Expo) app · two NestJS backends —
`auth-service` (auth, ops, agents, bookings, missions, payouts, signal-keys) and
`messenger-service` (relay, WebSocket gateway, sealed-sender, groups, file vault) ·
Signal Protocol (X3DH, Double Ratchet, sealed-sender v2) · Postgres · SQLCipher.
Full reverse-engineered map: [`SYSTEM_MAP.md`](SYSTEM_MAP.md).

> ⚠️ **Never auto-trigger** (real-world side effects): Emergency·SOS, Panic Button,
> Book Now (dispatches a real CPO), Log Out, repeated backup-password attempts.

---

## 2 · The strategy — the testing pyramid

Push the logic *down* the stack where tests are fast and reliable; keep the device
as a thin cap. Widest layer = most tests.

```
        ▲  device E2E        few — real phone, real media (BLOCKED on env)
       ▲▲  web (Playwright)  ops-console flows
      ▲▲▲  API (Jest)        332 routes — the backbone
     ▲▲▲▲  headless crypto   Signal protocol, no device
```

**Why this works:** the UI is a thin skin. Message delivery, group rekey, booking
math, access control, auth gating — all live in the API and the crypto core, both
reachable without a screen. So the everyday suite runs anywhere (CI, laptop) in
seconds, and only genuinely hardware-bound things (call media, camera/face,
biometric prompts, push) are left for the device layer.

---

## 3 · The four layers

| Layer | Folder | Runner | Tests | What it covers | Run | Device? |
|-------|--------|--------|:-----:|----------------|-----|:------:|
| **API** | `test/api/` | Jest | **527** | every backend route — auth, messaging, booking, ops, VBG, dept, incidents, attendance, family | `npm run test:api` | ❌ |
| **Headless crypto** | `test/crypto/` | Jest + libsignal | **8** | Signal protocol: 1:1 delivery, group delivery, rekey + forward secrecy | `npm run test:core` | ❌ |
| **Web** | `test/web/` | Playwright | **3** | ops-console: admin login (phone+password+OTP), section nav | `npm run test:admin` | ❌ |
| **Device E2E** | `test/device/` | WebdriverIO + Appium | 25 specs | real-device journeys — **currently blocked** (see §9) | `npm run wdio` | ✅ |

The first three (**538 tests**) are the device-free backbone and the source of truth today.

---

## 4 · Where coverage stands

**Backend API — ~96% of the 332 routes exercised**, in three tiers of depth:

| Tier | ~Endpoints | What it proves |
|---|---:|---|
| **Deep** (12 `*.deep.api.test.ts` suites) | ~90 | positive + negative + edge per endpoint — the full validation surface, auth gating, isolation |
| **Functional** (reads + write lifecycles) | ~130 | reads return correct **data**; writes do a full **round-trip + self-cleanup** |
| **Guard sweep** (1 suite, 314 tests) | 314 | *every* protected route rejects no-auth (`401`) — auth-gating coverage, non-destructive |

**Against the 588-case manual test plan** (messenger + departmental), each case was
classified by what its assertion needs:

| | Cases | Share |
|---|---:|---:|
| 🟢 Device-free (automated) | **247** | 42% |
| 🟡 Hybrid (logic automated, UI needs a device) | 185 | 31% |
| 🔴 Physical device required (calls, camera/face, biometric, push) | 156 | 27% |

Of the 247 device-free cases, **~217 are backed by deep functional tests**, ~30 by
reachability. *(A completed copy of the plan with per-case status lives on the
maintainer's machine, not in the repo.)*

---

## 5 · Repo structure

```
test/                        the 4 layers, one folder each
  api/            device-free API (527 tests) — START HERE
    *.api.test.ts        breadth: reads, write lifecycles, guard sweep
    *.deep.api.test.ts   depth: positive + negative + edge per endpoint
    support/             http.ts · session.ts (login cache) · shape.ts · sweep.ts · routes.json
  crypto/         headless Signal-protocol tests. *.core.test.ts + support/coreBarrel.ts
  web/            Playwright ops-console specs (*.spec.ts)
  device/         ALL device E2E (needs a phone):
    auth/ client/ cpo/ comms/ smoke/   screen & flow specs
    journeys/                           multi-phase (book → dispatch → mission)
    setup/                              device bring-up / restore helpers

src/                         the Page-Object framework the specs use
  config/         env.ts (typed creds from credentials.env), capabilities.ts
  mobile/         Page Objects + flows for the Android app (client + cpo)
  web/            Page Objects + flows for the ops console
  helpers/        selectors, glyphs

.github/workflows/  CI (typecheck on every push)
scripts/            device / adb helper shell scripts
SYSTEM_MAP.md       what the app does (reverse-engineered)
MULTIDEVICE.md      the 3-device call/message test plan
```

---

## 6 · Running the tests

```bash
npm install                 # after any clone/clean — node_modules is gitignored
cp credentials.env.example credentials.env   # then fill in staging accounts/URLs

# device-free — the everyday suite (no phone):
npm run test:api            # 527 API tests vs live staging
npm run test:core           # 8 headless-crypto tests
npm run test:admin          # 3 web tests (first run: npm run install:browsers)
npm run test:headless       # everything Jest, in-band

# device E2E (needs a connected device + Appium):
npm run wdio
```

> **Run the API suite in-band** if you invoke Jest directly — parallel workers each
> attempt a login and trip the `/auth/login` rate limit (5 per 10 min). The
> `npm run` scripts and the session cache already handle this.

---

## 7 · How to add a test

- **Where:** pick the layer folder. Device-free API test → `test/api/`.
- **Naming:** `foo.api.test.ts` for breadth/lifecycle; **`foo.deep.api.test.ts`**
  for a deep suite (positive + negative + edge on one endpoint).
- **The deep pattern** (copy an existing `*.deep.api.test.ts`):
  - **positive** — valid input → assert the real response *data*, not just status
  - **negative** — each validation rule → `400`; no auth → `401`; wrong role → `403`
  - **edge** — boundary values, idempotency
- **Golden rule for writes:** anything you create/change, **tear down** in
  `afterAll` (delete, or revert to the original). The suite leaves no debris on staging.
- Use the shared helpers in `test/api/support/`: `getSession(role)` for a cached
  token, `authGet/authPost/authPatch/authDelete`, `expectShape` for data assertions.

---

## 8 · Key design decisions (so nothing is a mystery)

- **Session cache** (`test/api/support/session.ts`) — logins are memoized in-process
  **and** on disk (8-min TTL) so a full run does ~4 logins, not ~500, staying under
  the login rate limit.
- **Guard sweep** (`guard-sweep.api.test.ts`) — hits every route in `routes.json`
  with no token and asserts `401`. The JWT guard fires before any handler, so it
  covers every endpoint *and* verifies auth-gating **without executing anything**
  (safe even for `/sos/raise`). A `2xx` here would be a missing-guard bug.
- **Cross-repo crypto** — `test/crypto/` imports the real Signal code from the
  **main app repo** via the `@core/*` / `@bravo/messenger-core` aliases
  (`jest.config.js` → `BRAVO_MAIN_REPO`, defaults to `~/Desktop/Work/Bravo_Secure`).
  No build step; it transpiles from source.
- **Three runners on purpose** — Jest (API + crypto), Playwright (web), WebdriverIO
  (device). Each is the right tool for its layer; the folder-per-layer split keeps
  them from tangling.

---

## 9 · Device E2E — why it's blocked

The `test/device/` layer is fully scaffolded (Page Objects, flows, 25 specs) but
blocked on **environment**, not code:

1. **Login** — the release build isn't debuggable, so token-injection login doesn't
   work, and a Play-Services emulator has no injectable biometric. Needs a
   **debuggable build** *or* a biometric-enabled device.
2. **Destructive flows** (booking → dispatch → mission, attendance clock-in) need a
   **seeded test environment** — controlled accounts, seedable state, relaxed limits.

Until then the **device-free layers are the source of truth.** The 3-device
call/message plan is in [`MULTIDEVICE.md`](MULTIDEVICE.md).

---

## 10 · What's gitignored (don't be alarmed by disk size)

`node_modules/`, `apk/` (built APKs), `allure-results/`, `test-results/`,
`playwright-report/`, `.playwright-mcp/`, `.explore/`, `credentials.env`, `*.log`.
**All regenerable** — safe to delete to reclaim space. The actual project is ~3 MB.
