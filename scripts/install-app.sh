#!/usr/bin/env bash
# Install the pulled BravoSecure APK onto a target device/emulator.
# Usage: ./scripts/install-app.sh <adb-serial>   e.g. 127.0.0.1:5555
set -euo pipefail

SERIAL="${1:?Usage: install-app.sh <adb-serial>}"
APK="$(dirname "$0")/../apk/bravosecure.apk"

[ -f "$APK" ] || { echo "Missing $APK — pull it first (adb pull base.apk)"; exit 1; }

echo "Installing on ${SERIAL} ..."
adb -s "${SERIAL}" install -r -g "${APK}"   # -g auto-grants runtime permissions
echo "✓ Installed. Launchable activity:"
adb -s "${SERIAL}" shell cmd package resolve-activity --brief com.bravosecure.app | tail -1
