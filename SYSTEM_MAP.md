# BravoSecure — System Map

> Reverse-engineered by driving the live app (`com.bravosecure.app` v1.0.55/1.0.56)
> on a Pixel 7a via Appium. Screenshots in `.explore/`.

## What the app is

**BravoSecure** is a Middle-East-focused (UAE / KSA) **executive-protection &
secure-communications super-app** by **OmniDevX Studio**. It bundles three
products behind one login:

1. **Bravo Messenger** — Signal-Protocol E2E encrypted comms (chat, groups, voice/video, files, intel feed)
2. **Bravo Secure** — on-demand **physical close protection** booking (CPOs, executive transport, VIP security)
3. **Virtual Bodyguard** (PRO) — AI **personal-safety monitoring** dashboard (geofence, live tracking, OSINT threat intel, panic button, 24/7 ops room)

Cross-cutting: **Emergency · SOS**, **Bravo Credits** (in-app currency),
tiered plans (**Lite / Pro**), **Agent Portal**, VPN-routed sessions.

## Tech stack (observed)

| Area | Evidence |
|------|----------|
| **React Native** | `com.horcrux.svg.*` views, no native resource-ids on inputs |
| **Signal Protocol** | "All communications protected by Signal Protocol" (login) |
| **argon2id** KDF | Restore-backup screen ("argon2id key derivation — server can't read your messages") |
| **Cloudflare R2** | Files empty-state ("encrypts locally, uploads to R2") |
| **Firebase Crashlytics** | Profile → "Crashlytics Dev Tools" (dev build) |
| **Android BiometricPrompt** | "Unlock Bravo Secure" system prompt + "Use PIN" fallback |
| 2FA, backup-password restore, File Vault MFA | Profile → Security; Restore screen; Files Vault |

## Auth / onboarding flow

```
[cold launch] → Biometric gate ("Unlock Bravo Secure", fingerprint / Use PIN)
                                                              │
Welcome ──"Sign In"──▶ Sign-in form (email + password) ──────┤
                                                              ▼
        Permissions ("Allow access": Location*, Contacts, Notifications, Camera, Mic)
                                                              ▼
        Restore Backup (argon2id; 5 wrong = 1h cooldown) ──"RESTORE"──▶
        "Restoring your messages…" (pulls server-side history) ──▶ HOME
```
\* Location is REQUIRED. See `src/pages/login.page.ts` + `src/pages/biometric.page.ts`.

## Navigation map

### Main bottom nav (4): HOME · MESSENGER · SECURE · PROFILE

**HOME — "Bravo Command"** (`.explore/01_home.png`)
- Emergency · SOS (red — DO NOT trigger in tests)
- Secure status: "SECURE · ONLINE · All systems nominal · VPN routed", live UTC/LDN clock
- Services (3): Bravo Messenger, Bravo Secure, Virtual Bodyguard (PRO)
- Top bar: notifications bell, profile avatar

**MESSENGER — "Bravo Messenger"** (own sub-nav: CHAT · GROUPS · CALL · FILES · NEWS)
- **CHAT** (`03_messenger.png`): 7 channels, AES-256 verified, search, compose FAB
- **GROUPS** (`04_groups.png`): "+ New Group", Departmental Chat (Pro broadcast), 5 groups w/ member counts + dates
- **CALL** (`05_call.png`): ALL/MISSED/VOICE/VIDEO tabs, call history, group calls, "Links"
- **FILES** (`06_files.png`): ALL/DOCS/IMG/VID/VOICE; client-encrypted → R2; **File Vault** (MFA per session)
- **NEWS** (`07_news.png`): threat-intel alerts (CRIT/HIGH), personalized feed (UAE/KSA/Finance/Security), affiliate ads, Bravo Services marketplace

**SECURE — "Bravo Secure"** (`09_secure.png`, `10_secure_scroll.png`) — tier LITE, region UAE
- Book Close Protection (executive transport / VIP / personal)
- Zone Map, My Credits; badges: AES-256, Vetted CPOs, Live Tracking, Secure Comms
- Booking flow: **① Select Service → ② Set Location → ③ Add-Ons → ④ Pay & Confirm** (Bravo Credits or card)
- Recent Bookings list

**PROFILE** (`11_profile.png`, `12_profile_scroll.png`) — Shirajul Islam · INDIVIDUAL
- Bravo Credits + Top Up
- Account: My Profile, My Bookings, Bravo Pro (Upgrade), Agent Portal
- Security: **Biometric Lock** (toggle — disable to skip fingerprint gate in tests), Two-Factor Auth
- Billing: Payment Methods, Transaction History
- Support: Help, Privacy Policy, Terms · Log Out
- Crashlytics Dev Tools (Send non-fatal / Force native crash) · footer: OmniDevX Studio v1.0.55

### Virtual Bodyguard — "Virtual Dashboard" (`15_vbg.png`) — PRO
- Principal (protected person) status
- Live Location + **Geofence Active**, map, location history
- Alerts (33 live / 8 critical), **Security Risk = HIGH** (SRA), **OSINT feed**
- Nearby: Medical / Police / Embassy
- Quick Actions: **Panic Button** (DO NOT trigger), Contact Ops (24/7), Request CPO
- Ops Room · Live Monitoring

## Two-sided marketplace — Client app vs Agent app

BravoSecure is a **two-sided marketplace** ("Uber for close protection"). The same
login screen routes to a different app depending on account role:

| | **Client** (INDIVIDUAL / PRO) | **CP Agent** (operator / CPO) |
|---|---|---|
| Test account | shirajulislamparvez@gmail.com | piyaldeb78@gmail.com |
| Lands on | HOME "Bravo Command" | **Agent Dashboard** |
| Role | Books & consumes protection | Fulfills dispatched jobs |

**The loop:** Client books (Secure → Select Service: **Transfer / Time Slot**) →
**Ops dispatches** → job appears in Agent **Job Marketplace** (`23_job_requests.png`,
filters: All / Transfer / Time Slot / Close Protection) → agent accepts → runs it as
a **live mission** (`MSN-…`, e.g. "Siddirganj → Gulshan", with **Track** + **Comms**).

### Agent Dashboard (`21_agent_after_login.png`, `22_agent_scroll.png`)
- Stats: **Duty hrs / month**, **Rate per hour**, **Rating**, **jobs** count
- **Next on Ops**: active mission `MSN-…` · LIVE · LEAD, route, Track / Comms
- **Job Requests** → "Available Jobs / Job Marketplace" (jobs near you, by type)
- **Attendance** — clock in/out of shifts
- **Messenger** — same E2E secure comms
- **Intel Feed** — security news / threat alerts
- **Coverage Regions** — active zone (AE)
- **Earnings** — earnings history

> Agent login skipped the biometric + restore-backup gates (straight to dashboard) —
> role/account-config dependent, not a universal flow.

## Notes for test automation

- **RN locators**: buttons expose `content-desc` (accessibility id), often with a
  trailing icon glyph → prefer `descriptionContains(...)` (UiAutomator) over exact match.
  Text inputs have **no id/a11y id** → locate by `EditText` type + order.
- **Destructive / outward-facing — never auto-trigger**: Emergency·SOS, Panic Button,
  Book Now (real CPO dispatch), Force native crash, Log Out, repeated backup-password
  attempts (5 = 1-hour cooldown).
- **Biometric**: real fingerprint can't be injected; use the "Use PIN" fallback
  (`src/pages/biometric.page.ts`) or toggle off Profile → Security → Biometric Lock.
- Screenshots exceed inline token limits → capture with `scripts/cap.sh` (auto-downscales).
