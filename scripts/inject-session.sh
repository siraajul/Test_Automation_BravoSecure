#!/usr/bin/env bash
#
# Token-injection login — skip the entire mobile login UI (OTP/biometric/restore).
#
# Logs in via the auth API, then writes the resulting tokens straight into the
# app's AsyncStorage (RKStorage SQLite, table catalystLocalStorage). On next
# launch the app's api layer reads auth:access_token and restores the session
# via /auth/me — no password, no OTP, no Welcome screen.
#
#   bash scripts/inject-session.sh <device-serial> <role>
#   role ∈ client1 | client2 | admin | agent | org   (default: client1)
#
# Requires: a debuggable app build (run-as works), the app launched at least
# once (so RKStorage exists), and sqlite3 on THIS machine (macOS ships it).
#
# ⚠ VERIFY ON DEVICE: whether the app boots straight to HOME or still shows a
# biometric gate on a restored session is empirical — if it gates, disable
# Profile → Security → Biometric Lock on the test account (one-time).
set -euo pipefail

DEVICE="${1:?usage: inject-session.sh <device-serial> <role>}"
ROLE="${2:-client1}"
APP="com.bravosecure.app"
AUTH="${AUTH_BASE_URL:-https://auth.94-136-184-52.sslip.io}"

# --- credentials (gitignored) ---
[ -f credentials.env ] || { echo "credentials.env not found (run from repo root)"; exit 1; }
# shellcheck disable=SC1091
set -a; source <(grep -E '^[A-Z0-9_]+=' credentials.env); set +a

case "$ROLE" in
  client1) ID="$CLIENT1_EMAIL";     PW="$CLIENT1_PASSWORD" ;;
  client2) ID="$CLIENT2_EMAIL";     PW="$CLIENT2_PASSWORD" ;;
  admin)   ID="$ADMIN_USER";        PW="$ADMIN_PASSWORD" ;;
  agent)   ID="$DUBAI_AGENT_EMAIL"; PW="$DUBAI_AGENT_PASSWORD" ;;
  org)     ID="$ORG_EMAIL";         PW="$ORG_PASSWORD" ;;
  *) echo "unknown role: $ROLE (client1|client2|admin|agent|org)"; exit 1 ;;
esac
[ -n "${ID:-}" ] || { echo "no credentials for role $ROLE"; exit 1; }

# --- 1. API login (email or E.164 phone) → tokens (staging OTP is any code) ---
if [[ "$ID" == +* ]]; then IDFIELD="\"phoneE164\":\"$ID\""; else IDFIELD="\"email\":\"$ID\""; fi
USERID=$(curl -s -X POST "$AUTH/auth/login" -H 'Content-Type: application/json' \
  -d "{$IDFIELD,\"password\":\"$PW\"}" | grep -oE '"userId":"[^"]+"' | cut -d'"' -f4 || true)
[ -n "$USERID" ] || { echo "[api] login failed for $ROLE ($ID) — rate-limited or bad creds?"; exit 1; }

TOKENS=$(curl -s -X POST "$AUTH/auth/verify" -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USERID\",\"code\":\"123456\",\"deviceId\":\"inject-$ROLE\",\"platform\":\"android\"}")
ACCESS=$(echo "$TOKENS"  | grep -oE '"accessToken":"[^"]+"'  | cut -d'"' -f4 || true)
REFRESH=$(echo "$TOKENS" | grep -oE '"refreshToken":"[^"]+"' | cut -d'"' -f4 || true)
[ -n "$ACCESS" ] || { echo "[api] verify failed: $TOKENS"; exit 1; }
echo "[api] $ROLE logged in — tokens obtained"

# --- 2. force-stop so AsyncStorage re-reads on next launch ---
adb -s "$DEVICE" shell am force-stop "$APP"

# --- 3. pull RKStorage, edit with the local sqlite3, push it back ---
TMP="$(mktemp)"
adb -s "$DEVICE" exec-out run-as "$APP" cat databases/RKStorage > "$TMP" 2>/dev/null \
  || { echo "[inject] cannot read RKStorage — app launched once? build debuggable?"; exit 1; }
sqlite3 "$TMP" \
  "INSERT OR REPLACE INTO catalystLocalStorage(key,value) VALUES
     ('auth:access_token','$ACCESS'),('auth:refresh_token','$REFRESH');"
adb -s "$DEVICE" push "$TMP" /data/local/tmp/RKStorage.inj >/dev/null
adb -s "$DEVICE" shell run-as "$APP" cp /data/local/tmp/RKStorage.inj databases/RKStorage
# drop WAL/journal so the copied DB is the source of truth
adb -s "$DEVICE" shell run-as "$APP" sh -c 'rm -f databases/RKStorage-wal databases/RKStorage-shm databases/RKStorage-journal' 2>/dev/null || true
adb -s "$DEVICE" shell rm -f /data/local/tmp/RKStorage.inj
rm -f "$TMP"
echo "[inject] auth:access_token + auth:refresh_token written to AsyncStorage"

# --- 4. launch — should boot authenticated ---
adb -s "$DEVICE" shell monkey -p "$APP" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
echo "[launch] $APP started — should boot authenticated as $ROLE (no login UI)"
