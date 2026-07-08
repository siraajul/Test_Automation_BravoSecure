# Multi-device (1:1 / group message + call) testing — plan

Goal: automate **1:1 message**, **1:1 audio/video call**, **group audio/video call**,
**group message** — as **member** and **admin** — across **3 endpoints**
(1 Pixel 7a + 2 BlueStacks), driven together via WebdriverIO **multiremote**.

## What automation CAN and CANNOT verify

- ✅ Send a message → assert it appears / sent + delivered ticks.
- ✅ Receive a message on another device (multiremote) → assert it arrives.
- ✅ Call **UI/state**: initiate → ringing → answer → connected → call timer →
  mute/unmute, video on/off → end / "ended by host" → call-history entry.
- ✅ Admin vs member: create group, add/remove members, end-for-all.
- ❌ **Actual media** — real audio heard, real video frames. Automation sees
  placeholders/black; media quality is out of scope for UI automation.

## Prerequisites (needed before any 3-device run)

1. **3 accounts** — one identity per device (these messengers bind one device per
   account; the restore screen "re-installs your Signal identity"). We currently
   have 2 (`TEST_*` client, `AGENT_*`). **A 3rd account is required**, plus:
   all three must be in **one shared group**, with a known **admin** + 2 **members**,
   and able to 1:1 each other.
2. **2 BlueStacks instances running** with **ADB enabled**
   (BlueStacks → Settings → Advanced → Android Debug Bridge → note the port).
   Then `adb connect 127.0.0.1:<port>` for each.
3. App installed on each emulator: `./scripts/install-app.sh <serial>`
   (APK already pulled to `apk/bravosecure.apk`).

## Setup steps (once BlueStacks is up)

```bash
adb connect 127.0.0.1:<port1>          # BlueStacks #1
adb connect 127.0.0.1:<port2>          # BlueStacks #2
adb devices -l                         # confirm 3 endpoints
./scripts/install-app.sh 127.0.0.1:<port1>
./scripts/install-app.sh 127.0.0.1:<port2>
# log each endpoint into its account (AuthFlow), grant camera/mic
```

## Test matrix (planned)

| Flow | Endpoints | Role |
|------|-----------|------|
| 1:1 send/receive message | 2 | — |
| 1:1 audio call (initiate→answer→end) | 2 | — |
| 1:1 video call | 2 | — |
| Group message (post + others receive) | 3 | member + admin |
| Group audio call | 3 | — |
| Group video call | 3 | — |
| Admin: create group / add member / end-for-all | 3 | admin |

## Open risks

- BlueStacks + UiAutomator2 can be quirky (resolution, FLAG_SECURE screenshots,
  Play Services). May need per-emulator capability tweaks.
- Calls are timing-sensitive → expect flakiness; generous waits + retries.
- Each fresh login triggers the ~3-min restore (per device) unless backup is disabled.
