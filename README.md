# BravoSecure Test Automation

**TypeScript** Appium + WebdriverIO (UiAutomator2) automation framework for the
**com.bravosecure.app** Android app (a two-sided executive-protection platform —
see [`SYSTEM_MAP.md`](SYSTEM_MAP.md)), targeting a wireless Pixel 7a.

## Environment

| Item    | Value |
|---------|-------|
| Device  | Pixel 7a (`lynx`) over wireless ADB — `192.168.10.192:33789` |
| Android | 17 (API 37) |
| App     | `com.bravosecure.app` / `.MainActivity` |
| Stack   | TypeScript · WebdriverIO 9 · Appium 3 (UiAutomator2) · Mocha · Allure |
| Java    | Temurin (`JAVA_HOME` auto-set in `wdio.conf.ts`) |

## Framework layout

```
wdio.conf.ts              Runner config: capabilities, suites, Allure, screenshot-on-failure
tsconfig.json
src/
  config/                 env.ts (typed credentials), capabilities.ts
  helpers/                selectors.ts (RN locator strategies)
  pages/                  Page Objects extending BasePage
    welcome / login / biometric / permissions / restoreBackup
    client/               home, messenger, secure, profile, virtualBodyguard, navigation
    agent/                agentDashboard, jobMarketplace
  flows/                  auth.flow.ts (role-aware login orchestration)
test/specs/
  auth/                   login.{client,agent,negative}.e2e.ts
  smoke/                  navigation.{client,agent}.e2e.ts
```

Page Objects are **role-aware** (`client` vs `agent`) because the same login
routes to two different apps. `AuthFlow.loginAs('client' | 'agent')` handles the
biometric gate, credentials, permissions, and restore-backup conditionally.

## Setup

```bash
npm install
npx appium driver install uiautomator2   # already installed in this repo
npm run doctor                            # verify the toolchain
```

## Connect the device

Wireless ADB ports change between sessions. Discover the current one with:

```bash
adb mdns services
```

Then connect (the test run does this automatically via `pretest`):

```bash
npm run connect
# or with a different address:
ANDROID_DEVICE=192.168.10.192:33789 npm run connect
```

## Coverage (current)

Validated green on the Pixel 7a:

| Suite | Specs | Flows covered |
|-------|------:|---------------|
| **agent** | 3 files / 5 tests | agent login, dashboard menu, Job Marketplace, Attendance, Earnings |
| **client** | 6 files / 13 tests | client login, Messenger (+5 sub-tabs/E2E badge), Secure (booking steps), Profile (security/agent-portal), Virtual Bodyguard, HOME/MESSENGER/SECURE/PROFILE nav |
| **auth** | 3 files | client login (+ agent→client switch + restore), agent login, negative |

Run a single role with `npm run test:client` / `npm run test:agent` — mixing roles
in one process forces the slow client restore, so prefer per-role runs.

## Run tests

```bash
npm test                  # all specs
npm run test:smoke        # smoke suite
npm run test:auth         # auth suite
npm run test:client       # client-role specs
npm run test:agent        # agent-role specs
npm run test:regression   # everything
npm run typecheck         # tsc --noEmit
npm run report            # generate + open Allure report
```

Each run connects the device, boots Appium automatically (`@wdio/appium-service`),
and (on failure) attaches a **screenshot + page source** to the Allure report.
Target a different device with `ANDROID_DEVICE=<ip:port> npm test`.

> Note: the app persists sessions (`noReset`) and **restores its last screen** on
> launch, so `loginAs` treats "authenticated" as *not on the welcome screen* and
> pages provide an `open()` that navigates back to their baseline.

## App flow (discovered live, v1.0.56)

```
Welcome ──tap "Sign In"──▶ Sign-in form ──email+password, "Sign in"──▶
  Permissions ("Allow access") ──▶ Restore Backup ──backup password, "RESTORE"──▶
  "Restoring your messages…" ──▶ Main app
```

Sometimes a cold launch shows a system **biometric** gate ("Unlock Bravo Secure")
before the Welcome/main screen.

### Locators (React Native)

| Element | Locator | Notes |
|---------|---------|-------|
| Welcome "Sign In" | `~Sign In` | accessibility id |
| Email field | `(//android.widget.EditText)[1]` | no id/a11y id (RN) |
| Password field | `(//android.widget.EditText)[2]` | `password=true` |
| "Sign in" submit | `~Sign in` | |
| Backup password | `//android.widget.EditText` | RESTORE BACKUP screen |
| "RESTORE" | `~RESTORE` | ⚠ 5 wrong = 1-hour cooldown |

### Fingerprint / biometric on a real device

A real fingerprint **cannot** be injected by ADB or Appium — the sensor is
hardware. `driver.fingerPrint()` and `adb emu finger` are **emulator-only**.
On the Pixel 7a, automate the **"Use PIN" fallback** instead (see
`src/pages/biometric.page.ts`): tap Use PIN, then enter `DEVICE_PIN` via keycodes.
Set `DEVICE_PIN` in `credentials.env` to enable this. Most robust of all:
disable the in-app biometric lock for the test account and rely on PIN.

## Credentials

Test-account secrets live in `credentials.env` (gitignored). Copy the template:

```bash
cp credentials.env.example credentials.env   # then fill in values
```

## Helper scripts

```
scripts/connect-device.sh ADB wireless connect helper (npm run connect)
scripts/cap.sh            Capture + downscale a device screenshot to .explore/
scripts/dump.sh           Dump + parse the UI hierarchy (locator discovery)
scripts/decode-shot.py    Decode appium-mcp screenshots (base64 JSON) to PNG
```
