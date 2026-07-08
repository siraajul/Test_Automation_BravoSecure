#!/usr/bin/env bash
S="${ANDROID_DEVICE:-192.168.10.192:33789}"
NAME="${1:-shot}"
adb -s "$S" exec-out screencap -p > ".explore/${NAME}.png" 2>/dev/null
sips -Z 1500 ".explore/${NAME}.png" >/dev/null 2>&1
echo ".explore/${NAME}.png"
