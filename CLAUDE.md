# CLAUDE.md

Guidance for working in this repo. Read [SYSTEM_MAP.md](SYSTEM_MAP.md) (app screens/flows) and
[README.md](README.md) (setup, locators, coverage) before adding tests.

## What this is

TypeScript automation framework for the **3-component** BravoSecure system:
- **Client** app (Android) — books protection
- **CPO** app (Android) — fulfills jobs (same APK, role-routed by account)
- **Admin** dashboard (Web) — dispatches/manages

**Stacks**: mobile = WebdriverIO 9 · Appium 3 (UiAutomator2) · Mocha; web = **Playwright**; reporting = Allure.
Multi-device comms/calls use 1 Pixel 7a + 2 BlueStacks (see `MULTIDEVICE.md`).

## Commands

```bash
npm run connect          # connect wireless ADB (rediscover port: adb mdns services)
npm run typecheck        # tsc --noEmit — ALWAYS run before a test run
npm run test:client      # client-role mobile suite (~4 min)
npm run test:cpo         # cpo-role mobile suite (~2 min)
npm run test:smoke       # smoke specs
npm run test:auth        # auth specs (client+cpo+negative)
npm run test:comms       # multiremote 1:1/group message+call (needs AVDs)        [STUB]
npm run test:admin       # Playwright admin web                                   [STUB]
npm run test:core        # headless messenger-core delivery (1:1 + group) — NO device, CI-ready
npm run install:app <serial>  /  install:browsers
npm run report           # Allure report
```

Single spec: `npx wdio run ./wdio.conf.ts --spec ./test/mobile/<...>.ts`.

**Run per-role, not mixed.** Mixing client+cpo in one process forces a logout and the slow
(~3 min) client restore. Prefer `test:client` / `test:cpo` separately.

## Layout

```
wdio.conf.ts              mobile runner — 1 device (suites, Allure, screenshot-on-failure)
wdio.multiremote.conf.ts  mobile runner — 3 devices (client + cpo + client2) for comms/calls
playwright.config.ts      web runner — Admin dashboard
src/config/               env.ts (clients[], cpo, admin, device roster), capabilities.ts
src/helpers/selectors.ts  RN locator builders (byText, byDescContains, byTextOrDesc, editTextAt)
src/mobile/pages/         Page Objects extending BasePage — client/ cpo/ comms/[STUB] + flat auth pages
src/mobile/flows/         auth.flow.ts (loginAs/ensureLoggedOut/detectRole/completeRestore), comms.flow.ts[STUB]
src/web/                  Playwright admin — pages/, flows/admin.flow.ts  [STUB]
test/mobile/{auth,smoke,client,cpo,comms}/   mobile specs (*.client.e2e.ts / *.cpo.e2e.ts)
test/web/  test/e2e/       admin web specs / cross-platform complete-flow  [STUB]
test/integration/         headless messenger-core delivery tests (*.core.test.ts) — NO device; see its README
jest.config.js            runner for test/integration (ts-jest; maps @bravo/messenger-core → app repo source)
scripts/                  connect-device, install-app, cap, dump, decode-shot
apk/bravosecure.apk       pulled APK for installing on emulators
```

`agent` was renamed to **cpo** throughout. **[STUB]** = scaffolded but not implemented
(locators unconfirmed / devices not connected) — fill in before enabling.

## Conventions

- **Page Object per screen**, default-exported singleton, extends `BasePage` with a `rootLocator`
  and an `isActive()`/`waitUntilActive()`. Specs assert via page getters, never raw selectors.
- **Locators (React Native)**: buttons expose `content-desc` (often with a trailing icon glyph →
  use `descriptionContains`, not exact). Many labels are `text`, not desc → use `byTextOrDesc`.
  Inputs have no id/a11y-id → locate by `editTextAt(n)`. SVG/image text (e.g. "Book Close Protection")
  is absent from the tree — pick a real text node ("BRAVO SECURE"). xpath is last resort.
- **Verify locators live** with `bash scripts/dump.sh <name>` before trusting them.
- Off-screen rows are lazy-rendered → `scrollIntoView` / a page `scrollTo(...)` before asserting.

## Critical gotchas (already handled in code — don't regress)

- **Foreground first**: `AuthFlow.passBiometric` calls `driver.activateApp()` before probing; at
  session start the app is often backgrounded and probes otherwise see nothing.
- **Logged-out landing is the login form** (`Sign in` lowercase + EMAIL field), not a welcome carousel.
- **Real fingerprint can't be injected** — use the system "Use PIN" fallback with `DEVICE_PIN`
  (keycodes 7..16), or disable Profile → Security → Biometric Lock. The gate can re-appear mid-restore.
- **Fresh client login → ~3 min argon2id restore** ("Restoring your messages"); `completeRestore`
  waits and re-unlocks biometric, then taps OPEN MESSENGER (which lands in the Messenger sub-app).
- **Logout differs by role**: client = PROFILE tab → scroll → Log Out; agent = top-right avatar → drawer → Log Out.

## NEVER trigger in tests (outward-facing / destructive)

Emergency·SOS, Panic Button, **Book Now** (dispatches a real CPO), accept-job / clock-in (real duty),
Force native crash, Log Out unless intended, repeated wrong backup passwords (5 = 1-hour cooldown).

## Secrets

`credentials.env` is gitignored — both test accounts, `BACKUP_PASSWORD`, `DEVICE_PIN`, device address.
Never commit it or print secrets. `credentials.env.example` is the committed template.
